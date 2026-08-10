import { supabase } from './supabase';
import { r2Service } from './r2Service';
import { ManusVisit, ManusService, ManusVehicle, ManusMaterial, ManusReport } from '../types/manus';
import { getBrazilTimestamp } from '../utils/dateUtils';
import { generateUrl as getProxyUrl } from './imgproxyService';


export interface ManusImageClassification {
  reportIndex: number;
  imageIndex: number;
  url: string;
  classification: 'A' | 'D' | 'X';
}

export class ManusIntegrationService {

  static async fetchVisits(orderMask: string): Promise<ManusVisit[]> {
    const url = `https://manus.app.br/version-live/api/1.1/wf/api_siges_orders_visits?CustomerDoc=${orderMask}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 03fdea2653a6f12f58c27bc8fb1de02b'
        }
      });
      if (!response.ok) {
        console.error(`Falha Manus API: ${response.status} ${response.statusText}`);
        throw new Error(`Erro ao buscar dados do Manus: ${response.statusText}`);
      }
      
      // Get raw text to inspect and fix malformed JSON
      const rawText = await response.text();

      // Try to parse JSON, with fallback for malformed responses
      let data: any = [];
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error("Failed to parse Manus API response as JSON:", parseError);
        
        // Fix common Manus API JSON issues:
        // 1. "Key":, (missing value) → "Key":null,
        // 2. Trailing commas before }]
        try {
          let fixedText = rawText
            .replace(/^\uFEFF/, '') // Remove BOM
            // Fix missing values: "Key":, → "Key":null,
            .replace(/:\s*,/g, ':null,')
            // Fix missing values at end: "Key":,} → "Key":null}
            .replace(/:\s*}/g, ':null}')
            .replace(/:\s*]/g, ':null]')
            // Remove trailing commas before } or ]
            .replace(/,\s*([\]}])/g, '$1');
          
          data = JSON.parse(fixedText);
        } catch (e) {
          console.error("All JSON parsing attempts failed, returning empty array");
          console.error("Raw response (last 1000 chars):", rawText.substring(Math.max(0, rawText.length - 1000)));
          data = [];
        }
      }

      let manusVisits: ManusVisit[] = [];
      if (Array.isArray(data)) {
        manusVisits = data as ManusVisit[];
      } else if (data && data.response && Array.isArray(data.response)) {
        manusVisits = data.response as ManusVisit[];
      }

      if (manusVisits.length === 0) return [];

      // Filtragem: Apenas visitas que não coincidem UniqueId com finger_print no banco
      const uniqueIds = manusVisits.map(v => v.UniqueId).filter(Boolean);

      if (uniqueIds.length > 0) {
        const { data: existingVisits, error: syncError } = await supabase
          .from('orders_visits')
          .select('finger_print')
          .in('finger_print', uniqueIds);

        if (!syncError && existingVisits && existingVisits.length > 0) {
          const existingFingerprints = new Set(existingVisits.map(v => v.finger_print));
          manusVisits = manusVisits.filter(v => !existingFingerprints.has(v.UniqueId));
        }
      }

      // Aplicar correção de fuso horário (-3h) em todas as visitas retornadas
      if (manusVisits.length > 0) {
        manusVisits = manusVisits.map(v => ({
          ...v,
          OrderVisitStartedDate: getBrazilTimestamp(v.OrderVisitStartedDate),
          OrderVisitFinishedDate: getBrazilTimestamp(v.OrderVisitFinishedDate)
        }));
      }

      return manusVisits;
    } catch (error) {
      console.error("Error fetching Manus visits", error);
      throw error;
    }
  }

  static async verifyDependencies(visit: ManusVisit, userId: string): Promise<{
    success: boolean;
    contractData?: any;
    message?: string;
  }> {

    // 0) Verificar se contrato existe
    const { data: contractData, error: errContract } = await supabase
      .from('contracts')
      .select('id, provider_department_id, provider_company_id, default_ov_asset_id, default_activity_id, client_id')
      .eq('code', visit.PlanCode)
      .maybeSingle();

    if (errContract || !contractData) {
      return { success: false, message: `Contrato (PlanCode: ${visit.PlanCode}) não foi localizado.` };
    }

    const contractId = contractData.id;
    const providerCompanyId = contractData.provider_company_id;
    const providerDepartmentId = contractData.provider_department_id;

    // 1) Serviços
    for (const s of visit.Services || []) {
      const { data: svcFound } = await supabase
        .from('cfg_services')
        .select('id')
        .eq('finger_print', s.ServiceId)
        .maybeSingle();

      if (svcFound) {
        // Atualizar cfg_services
        await supabase.from('cfg_services').update({
          description: s.Description,
          code: s.Code,
          unit: s.Unit,
          updated_at: getBrazilTimestamp(),
          updated_user_id: userId
        }).eq('id', svcFound.id);

        // Atualizar contracts_services
        // We first need to check if the link between contract and service exists
        const { data: csFound } = await supabase
          .from('contracts_services')
          .select('id')
          .eq('contract_id', contractId)
          .eq('service_id', svcFound.id)
          .maybeSingle();

        if (csFound) {
          await supabase.from('contracts_services').update({
            value_unit: s.PriceUnit,
            discount: s.Discount,
            value_total: s.PriceTotal
          }).eq('id', csFound.id);
        } else {
          await supabase.from('contracts_services').insert({
            contract_id: contractId,
            service_id: svcFound.id,
            value_unit: s.PriceUnit,
            discount: s.Discount,
            value_total: s.PriceTotal
          });
        }
      } else {
        // Criar cfg_services
        const { data: newSvc, error: errNewSvc } = await supabase.from('cfg_services').insert({
          description: s.Description,
          code: s.Code,
          unit: s.Unit,
          updated_at: getBrazilTimestamp(),
          updated_user_id: userId,
          finger_print: s.ServiceId
        }).select('id').single();

        if (newSvc) {
          await supabase.from('contracts_services').insert({
            contract_id: contractId,
            service_id: newSvc.id,
            value_unit: s.PriceUnit,
            discount: s.Discount,
            value_total: s.PriceTotal
          });
        }
      }
    }

    // 2) Transportes (Veículos)
    for (const v of visit.Vehicles || []) {
      const { data: vehFound } = await supabase
        .from('vehicles')
        .select('id')
        .eq('finger_print', v.VehicleId)
        .maybeSingle();

      if (vehFound) {
        await supabase.from('vehicles').update({
          plates: v.Description,
          description: v.Description,
          unit: v.OperationUnit,
          value_unit: v.PriceUnit,
          discount: v.Discount,
          updated_at: getBrazilTimestamp(),
          updated_user_id: userId
        }).eq('id', vehFound.id);
      } else {
        await supabase.from('vehicles').insert({
          company_id: providerCompanyId,
          department_id: providerDepartmentId,
          plates: v.Description,
          value_unit: v.PriceUnit,
          unit: v.OperationUnit,
          discount: v.Discount,
          description: v.Description,
          finger_print: v.VehicleId,
          created_at: getBrazilTimestamp(),
          created_user_id: userId
        });
      }
    }

    // 3) Materiais
    for (const rep of visit.Reports || []) {
      for (const m of rep.Materials || []) {
        const { data: matFound } = await supabase
          .from('materials')
          .select('id')
          .eq('finger_print', m.MaterialId)
          .maybeSingle();

        if (matFound) {
          await supabase.from('materials').update({
            code: m.Code,
            description: m.Description,
            company_id: 1, // hardcoded per requirements
            price_unit: m.PriceUnit,
            unit: m.Unit,
            provider_company_id: providerCompanyId,
            updated_at: getBrazilTimestamp(),
            updated_user_id: userId
          }).eq('id', matFound.id);
        } else {
          await supabase.from('materials').insert({
            code: m.Code,
            description: m.Description,
            company_id: 1,
            price_unit: m.PriceUnit,
            unit: m.Unit,
            provider_company_id: providerCompanyId,
            finger_print: m.MaterialId,
            created_at: getBrazilTimestamp(),
            created_user_id: userId
          });
        }
      }
    }

    return { success: true, contractData };
  }

  static async importVisit(
    visit: ManusVisit, 
    contractData: any, 
    orderData: any, 
    userId: string,
    selectedClassifications?: ManusImageClassification[]
  ): Promise<string | null> {
    const now = getBrazilTimestamp();
    const totalAmountAssets = (visit.Reports || []).length;

    try {
      // 10) Criar visita (orders_visits)
      const { data: newVisit, error: errVisit } = await supabase.from('orders_visits').insert({
        ov_mask: orderData.orderMask || visit.OrderMask, // assuming mask format
        o_id: orderData.id,
        ov_started_at: getBrazilTimestamp(visit.OrderVisitStartedDate),
        ov_ended_at: getBrazilTimestamp(visit.OrderVisitFinishedDate),
        ov_processing_id: 2,
        ov_status_id: 2,
        ov_reported_at: now,
        ov_reported_user_id: userId,
        ov_team_leader_id: orderData.teamLeaderId, // matching current database field names assumption
        ov_assets_amount: totalAmountAssets,
        ov_assets_reported_amount: totalAmountAssets,
        ov_materials_value: visit.InvoiceMaterialValue,
        ov_services_value: visit.InvoiceServicesValue,
        ov_vehicles_value: visit.InvoiceVehiclesValue,
        ov_total_value: visit.InvoiceMaterialValue + visit.InvoiceServicesValue + visit.InvoiceVehiclesValue,
        created_user_id: userId,
        created_at: now,
        updated_user_id: userId,
        updated_at: now,
        // ov_durations_hours = let trigger handle or null
        ov_comments: `EQUIPE: ${visit.OrderVisitLeaderNameShort}, ${visit.OrderVisitTeam}.\n Ciente: ${visit.AgreeUserName}`,
        finger_print: visit.UniqueId
      }).select('id').single();

      if (errVisit || !newVisit) {
        console.error("Erro insert orders_visits:", errVisit);
        return null;
      }

      const orderVisitId = newVisit.id;

      // 11) Incluir líder
      await supabase.from('orders_visits_teams').insert({
        ov_id: orderVisitId,
        user_id: orderData.teamLeaderId,
        is_leader: true,
        order_id: 1
      });

      // 12) Serviços
      for (const s of visit.Services || []) {
        // Fetch service id and contract value
        const { data: svc } = await supabase.from('cfg_services').select('id').eq('finger_print', s.ServiceId).single();
        if (svc) {
          const { data: cSvc } = await supabase.from('contracts_services')
            .select('value_unit')
            .eq('contract_id', contractData.id)
            .eq('service_id', svc.id).single();

          await supabase.from('orders_visits_services').insert({
            ov_id: orderVisitId,
            service_id: svc.id,
            value_unit: cSvc?.value_unit || s.PriceUnit,
            amount: s.Amount,
            discount: s.Discount,
            value_total: s.PriceTotal,
            created_user_id: userId,
            created_at: now
          });
        }
      }

      // 13) Veículos
      if (visit.Vehicles && visit.Vehicles.length > 0) {
        // Find vehicle based on description, but wait, the prompt says finger_print = VehicleId. 
        // Let's use finger_print to get it securely.
        for (const v of visit.Vehicles) {
          const { data: veh } = await supabase.from('vehicles').select('id').eq('finger_print', v.VehicleId).single();
          if (veh) {
            await supabase.from('orders_visits_vehicles').insert({
              ov_id: orderVisitId,
              vehicle_id: veh.id,
              recorder_start: visit.AssetStarted,
              recorder_end: visit.AssetEnded,
              amount: visit.AssetEnded - visit.AssetStarted,
              created_at: now,
              created_user_id: userId
            });
          }
        }
      }

      // 14, 15, 16) Ativos, Materiais, e Imagens
      const reports = visit.Reports || [];
      for (let rIdx = 0; rIdx < reports.length; rIdx++) {
        const rep = reports[rIdx];
        let assetId = contractData.default_ov_asset_id;
        let vAssetData = null;

        if (rep.AssetCode !== "0") {
          const { data: foundAsset } = await supabase.from('v_assets')
            .select('*')
            .eq('code', rep.AssetCode)
            .maybeSingle();

          if (foundAsset) {
            assetId = foundAsset.id;
            vAssetData = foundAsset;
          }
        }

        if (!vAssetData) {
          // If no specific asset found, try to load data for the default
          const { data: defAsset } = await supabase.from('v_assets')
            .select('*')
            .eq('id', assetId)
            .maybeSingle();
          vAssetData = defAsset || {};
        }

        const companyId = orderData.companyId || 1;
        const imgPath = `companies/${companyId}/assets/${assetId}`;

        const beforeFiles: string[] = [];
        const afterFiles: string[] = [];
        
        // r2Service is now static

        // Requirement: scan only Reports.Images
        const rawImages = rep.Images || [];

        for (let iIdx = 0; iIdx < rawImages.length; iIdx++) {
          const img = rawImages[iIdx];
          const rawUrl = img.Url || (img as any).PhotoUrl;
          if (!rawUrl) continue;

          let fileName = '';
          try {
            const urlObj = new URL(rawUrl);
            const originalName = urlObj.pathname.split('/').pop() || 'image.jpg';
            fileName = `${rIdx}_${iIdx}_${originalName}`;
          } catch (e) {
            fileName = `${rIdx}_${iIdx}_image.jpg`;
          }

          const manual = selectedClassifications?.find(c => 
            c.reportIndex === rIdx && 
            c.imageIndex === iIdx
          );

          let isBefore = false;
          let isAfter = false;
          let isIgnored = false;

          if (manual) {
            isBefore = manual.classification === 'A';
            isAfter = manual.classification === 'D';
            isIgnored = manual.classification === 'X';
          } else {
            const sectionDoc = ((img as any).CustomerComments || img.CommentsCustomer || "").toUpperCase().trim();
            isBefore = sectionDoc.startsWith('A') || sectionDoc === 'A';
            isAfter = sectionDoc.startsWith('D') || sectionDoc === 'D';
            isIgnored = !isBefore && !isAfter;
          }
          
          if (isIgnored) {
            console.warn(`[ImportImag] DEBUG: IGNORANDO R:${rIdx} I:${iIdx}`);
            continue;
          }

          try {
            // Tenta primeiro via imgproxy (formato webp otimizado)
            // Se falhar, usa a URL original da imagem diretamente
            let fetchedBlob: Blob | null = null;

            try {
              const proxyUrl = getProxyUrl(rawUrl, { format: 'webp' });
              const imgResp = await fetch(proxyUrl);
              if (imgResp.ok) {
                fetchedBlob = await imgResp.blob();
              } else {
                console.warn(`[ImportImag] Imgproxy falhou (${imgResp.status}) R:${rIdx} I:${iIdx} - tentando URL original`);
              }
            } catch (proxyErr) {
              console.warn(`[ImportImag] Imgproxy exception R:${rIdx} I:${iIdx} - tentando URL original:`, proxyErr);
            }

            // Fallback: buscar da URL original do Manus se imgproxy falhou
            if (!fetchedBlob) {
              try {
                const origResp = await fetch(rawUrl);
                if (origResp.ok) {
                  fetchedBlob = await origResp.blob();
                } else {
                  console.error(`[ImportImag] URL original falhou (${origResp.status}) R:${rIdx} I:${iIdx}`);
                }
              } catch (origErr) {
                console.error(`[ImportImag] URL original exception R:${rIdx} I:${iIdx}:`, origErr);
              }
            }

            if (fetchedBlob) {
              const file = new File([fetchedBlob], fileName, { type: fetchedBlob.type || 'image/jpeg' });
              
              try {
                await r2Service.uploadFile(file, `${imgPath}/${fileName}`);

                if (isBefore) {
                  beforeFiles.push(fileName);
                } else if (isAfter) {
                  afterFiles.push(fileName);
                }
              } catch (uploadErr) {
                console.error(`[ImportImag] R2 Upload FAIL R:${rIdx} I:${iIdx}:`, uploadErr);
              }
            } else {
              console.error(`[ImportImag] Imagem não obtida (ignorada) R:${rIdx} I:${iIdx} - URL: ${rawUrl}`);
            }
          } catch (err) {
            console.error(`[ImportImag] FATAL R:${rIdx} I:${iIdx}:`, err);
          }
        }

        const { data: newOva, error: errOva } = await supabase.from('orders_visits_assets').insert({
          ov_id: orderVisitId,
          asset_id: assetId,
          before_unit_id: vAssetData.unit_id,
          before_tag_id: vAssetData.tag_id,
          before_tag_sub_id: vAssetData.tag_sub_id,
          before_status_id: vAssetData.status_id,
          before_status_at: vAssetData.status_at,
          before_comments: ".",
          before_img_file_path: imgPath,
          before_img_file_name: null,
          before_priority_id: vAssetData.priority_id,
          before_unit_asset_tag_id: vAssetData.unit_asset_tag_id,
          before_img_files_names: beforeFiles.length > 0 ? JSON.stringify(beforeFiles) : null,
          before_client_id: vAssetData.client_id,

          is_moved: false,
          moved_comments: null,

          after_unit_id: vAssetData.unit_id,
          after_tag_id: vAssetData.tag_id,
          after_tag_sub_id: vAssetData.tag_sub_id,
          after_status_id: vAssetData.status_id,
          after_status_at: vAssetData.status_at,
          after_comments: `${rep.Actions} + ${rep.Comments}`,
          after_img_file_path: imgPath,
          after_img_file_name: null,
          after_priority_id: vAssetData.priority_id,
          after_unit_asset_tag_id: vAssetData.unit_asset_tag_id,
          after_img_files_names: afterFiles.length > 0 ? JSON.stringify(afterFiles) : null,
          after_client_id: vAssetData.client_id,

          processing_id: 2,
          o_id: orderData.id,
          op_id: orderData.parentId,

          reported_user_id: userId,
          reported_at: now,
          created_user_id: userId,
          created_at: now,
          is_filed: false
        }).select('id').single();

        if (newOva) {
          const ovaId = newOva.id;

          // 15) Materials
          for (const m of rep.Materials || []) {
            const { data: mat } = await supabase.from('materials').select('id').eq('finger_print', m.MaterialId).single();
            if (mat) {
              await supabase.from('orders_visits_assets_materials').insert({
                ov_id: orderVisitId,
                asset_id: assetId,
                material_id: mat.id,
                amount: m.Amount,
                value_unit: m.PriceUnit,
                value_total: m.Amount * m.PriceUnit * m.Discount,
                discount: m.Discount,
                ova_id: ovaId,
                created_user_id: userId,
                created_at: now
              });
            }
          }
        }
      }

      return orderVisitId;

    } catch (err) {
      console.error("Error importing visit:", err);
      return null;
    }
  }

}

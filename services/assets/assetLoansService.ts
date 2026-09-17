import { supabase } from '../supabase';
import { r2Service } from '../r2Service';
import { 
    AssetLoan, 
    AssetLoanChecklist, 
    AssetLoanChecklistImage,
    CreateAssetLoanInput,
    UpdateAssetLoanInput,
    SaveChecklistItemInput
} from '../../types';
import { getPublicImageUrl } from '../imageUtils';
import { getBrazilTimestamp } from '../../utils/dateUtils';

const getLocalTimestamp = () => getBrazilTimestamp();

const getSaoPauloDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
};

const mapLoan = (item: any): AssetLoan => ({
    id: item.id.toString(),
    assetId: item.asset_id.toString(),
    borrowerName: item.borrower_name,
    lenderUserId: item.lender_user_id.toString(),
    expectedReturnDate: item.expected_return_date,
    actualReturnDate: item.actual_return_date,
    status: item.status,
    notes: item.notes,
    isDeleted: item.is_deleted,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    createdUserId: item.created_user_id?.toString(),
    // Signature fields
    signatureDeliveryPath: item.signature_delivery_path,
    signatureDeliveryName: item.signature_delivery_name,
    signatureDeliveryAt: item.signature_delivery_at,
    signatureDeliverySignerName: item.signature_delivery_signer_name,
    signatureReturnPath: item.signature_return_path,
    signatureReturnName: item.signature_return_name,
    signatureReturnAt: item.signature_return_at,
    signatureReturnSignerName: item.signature_return_signer_name,
    // Inspector fields
    inspectorDeliveryUserId: item.inspector_delivery_user_id?.toString(),
    inspectorReturnUserId: item.inspector_return_user_id?.toString(),
    itemsChecklistsDivergentCount: item.items_checklists_divergent_count ?? 0,
    // UI Helpers from view
    assetCode: item.asset_code,
    assetDescription: item.asset_description,
    assetSerial: item.asset_serial,
    assetBrand: item.asset_brand,
    assetModel: item.asset_model,
    assetImgUrl: getPublicImageUrl(item.asset_img_path, item.asset_img_name, { width: 200, height: 200, resize: 'cover' }),
    assetTypeName: item.asset_type_name,
    lenderName: item.lender_name,
    lenderNameShort: item.lender_name_short,
    inspectorDeliveryName: item.inspector_delivery_name,
    inspectorReturnName: item.inspector_return_name,
    computedStatus: item.computed_status,
});

const mapChecklist = (item: any): AssetLoanChecklist => ({
    id: item.id.toString(),
    loanId: item.loan_id.toString(),
    checklistTypeId: item.loan_checklist_id?.toString(),
    phase: item.phase,
    status: item.status,
    customItemDescription: item.custom_item_description,
    notes: item.notes,
    filledByUserId: item.filled_by_user_id?.toString(),
    filledAt: item.filled_at,
    createdAt: item.created_at,
    isDivergent: item.is_divergent ?? false,
    // UI Helpers
    itemDescription: item.custom_item_description || item.item_description,
    filledByName: item.filled_by_name,
});

const mapImage = (item: any): AssetLoanChecklistImage => ({
    id: item.id.toString(),
    checklistId: item.checklist_id.toString(),
    imageUrl: item.image_url,
    imageType: item.image_type,
    uploadedByUserId: item.uploaded_by_user_id?.toString(),
    createdAt: item.created_at,
    // UI Helpers
    uploadedByName: item.uploaded_by_name,
});

export const assetLoansService = {
    // ===== EMPRÉSTIMOS =====

    async getLoansByAssetId(assetId: string): Promise<AssetLoan[]> {
        const { data, error } = await supabase
            .from('v_assets_loans')
            .select('*')
            .eq('asset_id', parseInt(assetId))
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return (data || []).map(mapLoan);
    },

    async getLoanById(id: string): Promise<AssetLoan> {
        const { data, error } = await supabase
            .from('v_assets_loans')
            .select('*')
            .eq('id', parseInt(id))
            .single();

        if (error) {
            throw error;
        }

        return mapLoan(data);
    },

    async createLoan(input: CreateAssetLoanInput, userId: string): Promise<AssetLoan> {
        const { data, error } = await supabase
            .from('assets_loans')
            .insert([{
                asset_id: parseInt(input.assetId),
                borrower_name: input.borrowerName,
                lender_user_id: parseInt(input.lenderUserId),
                expected_return_date: input.expectedReturnDate,
                notes: input.notes,
                status: 'analysis',
                created_user_id: parseInt(userId),
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        const loanId = data.id;

        const { data: assetData } = await supabase
            .from('v_assets')
            .select('type_id')
            .eq('id', input.assetId)
            .single();

        if (assetData?.type_id) {
            
            const { data: checklistAssoc, error: assocError } = await supabase
                .from('cfg_assets_types_loans_checklists')
                .select('checklist_id, cfg_loans_checklists:checklist_id(sort_order)')
                .eq('asset_type_id', assetData.type_id);

            if (assocError) {
            }
            

            if (checklistAssoc && checklistAssoc.length > 0) {
                const sortedAssoc = [...checklistAssoc].sort((a: any, b: any) => {
                    const orderA = a.cfg_loans_checklists?.sort_order ?? 0;
                    const orderB = b.cfg_loans_checklists?.sort_order ?? 0;
                    return orderA - orderB;
                });

                const now = getLocalTimestamp();
                const checklistsToCreate: any[] = [];

                for (const assoc of sortedAssoc) {
                    checklistsToCreate.push({
                        loan_id: loanId,
                        loan_checklist_id: assoc.checklist_id,
                        phase: 'before',
                        status: 'pending',
                        filled_by_user_id: parseInt(userId),
                        filled_at: now,
                    });
                    checklistsToCreate.push({
                        loan_id: loanId,
                        loan_checklist_id: assoc.checklist_id,
                        phase: 'after',
                        status: 'pending',
                        filled_by_user_id: parseInt(userId),
                        filled_at: now,
                    });
                }

                
                const { error: insertError } = await supabase
                    .from('assets_loans_checklists')
                    .insert(checklistsToCreate);
                    
                if (insertError) {
                }
            }
        }

        return this.getLoanById(loanId.toString());
    },

    async updateLoan(id: string, input: UpdateAssetLoanInput): Promise<AssetLoan> {
        const updates: any = {
            updated_at: getLocalTimestamp(),
        };

        if (input.borrowerName !== undefined) updates.borrower_name = input.borrowerName;
        if (input.lenderUserId !== undefined) updates.lender_user_id = parseInt(input.lenderUserId);
        if (input.expectedReturnDate !== undefined) updates.expected_return_date = input.expectedReturnDate;
        if (input.notes !== undefined) updates.notes = input.notes;

        const { error } = await supabase
            .from('assets_loans')
            .update(updates)
            .eq('id', parseInt(id));

        if (error) {
            throw error;
        }

        return this.getLoanById(id);
    },

    async activateLoan(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('assets_loans')
            .update({
                status: 'pending',
                inspector_delivery_user_id: parseInt(userId),
                updated_at: getLocalTimestamp(),
            })
            .eq('id', parseInt(id));

        if (error) {
            throw error;
        }
    },

    async returnLoan(id: string, userId: string): Promise<void> {
        const loanId = parseInt(id);

        const { data: beforeItems } = await supabase
            .from('assets_loans_checklists')
            .select('loan_checklist_id, custom_item_description, status')
            .eq('loan_id', loanId)
            .eq('phase', 'before');

        const { data: afterItems } = await supabase
            .from('assets_loans_checklists')
            .select('id, loan_checklist_id, custom_item_description, status')
            .eq('loan_id', loanId)
            .eq('phase', 'after');

        let divergentCount = 0;
        const divergentAfterIds: number[] = [];
        if (beforeItems && afterItems) {
            for (const before of beforeItems) {
                const match = afterItems.find(a =>
                    a.loan_checklist_id === before.loan_checklist_id &&
                    a.custom_item_description === before.custom_item_description
                );
                if (match && match.status !== before.status) {
                    divergentCount++;
                    divergentAfterIds.push(match.id);
                }
            }
        }

        if (divergentAfterIds.length > 0) {
            await supabase
                .from('assets_loans_checklists')
                .update({ is_divergent: true })
                .in('id', divergentAfterIds);
        }

        const { error } = await supabase
            .from('assets_loans')
            .update({
                status: 'closed',
                actual_return_date: getSaoPauloDate(),
                inspector_return_user_id: parseInt(userId),
                items_checklists_divergent_count: divergentCount,
                updated_at: getLocalTimestamp(),
            })
            .eq('id', loanId);

        if (error) {
            throw error;
        }
    },

    async deleteLoan(id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('assets_loans')
            .update({
                is_deleted: true,
                deleted_user_id: parseInt(userId),
                updated_at: getLocalTimestamp(),
            })
            .eq('id', parseInt(id));

        if (error) {
            throw error;
        }
    },

    // ===== CHECKLISTS =====

    async getChecklists(loanId: string, phase: 'before' | 'after'): Promise<AssetLoanChecklist[]> {
        const { data, error } = await supabase
            .from('assets_loans_checklists')
            .select('*, cfg_loans_checklists:loan_checklist_id(sort_order)')
            .eq('loan_id', parseInt(loanId))
            .eq('phase', phase);

        if (error) {
            throw error;
        }

        // Fetch descriptions from cfg_loans_checklists for items that have a loan_checklist_id
        const typeIds = [...new Set((data || []).map((item: any) => item.loan_checklist_id).filter(Boolean))];
        let descriptionMap: Record<number, string> = {};
        let sortOrderMap: Record<number, number> = {};

        if (typeIds.length > 0) {
            const { data: cfgData } = await supabase
                .from('cfg_loans_checklists')
                .select('id, description, sort_order')
                .in('id', typeIds);

            if (cfgData) {
                descriptionMap = Object.fromEntries(cfgData.map((c: any) => [c.id, c.description]));
                sortOrderMap = Object.fromEntries(cfgData.map((c: any) => [c.id, c.sort_order]));
            }
        }

        const items = (data || []).map((item: any) => ({
            ...mapChecklist(item),
            itemDescription: item.custom_item_description || descriptionMap[item.loan_checklist_id] || '',
            sortOrder: sortOrderMap[item.loan_checklist_id] ?? 0,
        }));

        items.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        return items;
    },

    async saveChecklist(loanId: string, phase: string, items: SaveChecklistItemInput[], userId: string): Promise<{ id: number; checklistTypeId: string | null; customItemDescription?: string }[]> {
        // Delete existing checklists for this loan and phase
        await supabase
            .from('assets_loans_checklists')
            .delete()
            .eq('loan_id', parseInt(loanId))
            .eq('phase', phase);

        // Insert new items
        const checklists = items.map(item => ({
            loan_id: parseInt(loanId),
            loan_checklist_id: item.checklistTypeId ? parseInt(item.checklistTypeId) : null,
            custom_item_description: item.customItemDescription,
            phase,
            status: item.status,
            notes: item.notes,
            filled_by_user_id: parseInt(userId),
            filled_at: getLocalTimestamp(),
        }));

        const { data, error } = await supabase
            .from('assets_loans_checklists')
            .insert(checklists)
            .select('id, loan_checklist_id, custom_item_description');

        if (error) {
            throw error;
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            checklistTypeId: row.loan_checklist_id?.toString() || null,
            customItemDescription: row.custom_item_description,
        }));
    },

    async updateChecklistItem(checklistId: number, status: string, notes: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('assets_loans_checklists')
            .update({
                status,
                notes,
                filled_by_user_id: parseInt(userId),
                filled_at: getLocalTimestamp(),
            })
            .eq('id', checklistId);

        if (error) {
            throw error;
        }
    },

    async isChecklistComplete(loanId: string, phase: 'before'): Promise<boolean> {
        const { data, error } = await supabase
            .from('assets_loans_checklists')
            .select('id')
            .eq('loan_id', parseInt(loanId))
            .eq('phase', phase)
            .neq('status', 'pending');

        if (error) {
            return false;
        }

        // Check if there's at least one item and all are not pending
        const { count } = await supabase
            .from('assets_loans_checklists')
            .select('id', { count: 'exact', head: true })
            .eq('loan_id', parseInt(loanId))
            .eq('phase', phase);

        return (data?.length || 0) > 0 && (data?.length || 0) === (count || 0);
    },

    async getChecklistItemsCount(loanId: string, phase: 'before'): Promise<{ total: number; filled: number }> {
        const { count: total } = await supabase
            .from('assets_loans_checklists')
            .select('id', { count: 'exact', head: true })
            .eq('loan_id', parseInt(loanId))
            .eq('phase', phase);

        const { count: filled } = await supabase
            .from('assets_loans_checklists')
            .select('id', { count: 'exact', head: true })
            .eq('loan_id', parseInt(loanId))
            .eq('phase', phase)
            .neq('status', 'pending');

        return { total: total || 0, filled: filled || 0 };
    },

    // ===== IMAGENS =====

    async getChecklistImages(checklistId: string): Promise<AssetLoanChecklistImage[]> {
        const { data, error } = await supabase
            .from('assets_loans_checklists_images')
            .select('*')
            .eq('checklist_id', parseInt(checklistId))
            .order('created_at');

        if (error) {
            throw error;
        }

        return (data || []).map((item: any) => mapImage(item));
    },

    async uploadChecklistImage(checklistId: string, imageUrl: string, imageType: string = 'photo', userId: string): Promise<AssetLoanChecklistImage> {
        const { data, error } = await supabase
            .from('assets_loans_checklists_images')
            .insert([{
                checklist_id: parseInt(checklistId),
                image_url: imageUrl,
                image_type: imageType,
                uploaded_by_user_id: parseInt(userId),
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return mapImage(data);
    },

    async deleteChecklistImage(id: string): Promise<void> {
        const { error } = await supabase
            .from('assets_loans_checklists_images')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            throw error;
        }
    },

    async uploadChecklistImageFromPending(checklistDbId: number, imageUrl: string, imageType: string = 'photo', userId: string): Promise<AssetLoanChecklistImage> {
        const { data, error } = await supabase
            .from('assets_loans_checklists_images')
            .insert([{
                checklist_id: checklistDbId,
                image_url: imageUrl,
                image_type: imageType,
                uploaded_by_user_id: parseInt(userId),
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return mapImage(data);
    },

    // ===== UTILITIES =====

    async getOverdueLoans(): Promise<AssetLoan[]> {
        const today = getSaoPauloDate();
        
        const { data, error } = await supabase
            .from('v_assets_loans')
            .select('*')
            .eq('status', 'pending')
            .lt('expected_return_date', today)
            .order('expected_return_date');

        if (error) {
            throw error;
        }

        return (data || []).map(mapLoan);
    },

    async getActiveLoansCount(): Promise<number> {
        const { count } = await supabase
            .from('assets_loans')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .eq('is_deleted', false);

        return count || 0;
    },

    async saveLoanSignature(loanId: string, type: 'delivery' | 'return', base64: string, signerName: string): Promise<void> {
        const folderPath = `companies/1/assets_loans/${loanId}/signatures`;
        const fileName = `${type}_${Date.now()}.png`;
        const fullPath = `${folderPath}/${fileName}`;

        try {
            const res = await fetch(base64);
            const blob = await res.blob();
            const uploadFile = new File([blob], `signature_${type}.png`, { type: 'image/png' });
            await r2Service.uploadFile(uploadFile as any, fullPath);

            const updateData: any = {};
            if (type === 'delivery') {
                updateData.signature_delivery_path = folderPath;
                updateData.signature_delivery_name = fileName;
                updateData.signature_delivery_at = getLocalTimestamp();
                updateData.signature_delivery_signer_name = signerName;
            } else {
                updateData.signature_return_path = folderPath;
                updateData.signature_return_name = fileName;
                updateData.signature_return_at = getLocalTimestamp();
                updateData.signature_return_signer_name = signerName;
            }

            const { error } = await supabase
                .from('assets_loans')
                .update(updateData)
                .eq('id', parseInt(loanId));

            if (error) throw error;
        } catch (err) {
            throw err;
        }
    },

    async deleteLoanSignature(loanId: string, type: 'delivery' | 'return'): Promise<void> {
        const updateData: any = {};
        if (type === 'delivery') {
            updateData.signature_delivery_path = null;
            updateData.signature_delivery_name = null;
            updateData.signature_delivery_at = null;
        } else {
            updateData.signature_return_path = null;
            updateData.signature_return_name = null;
            updateData.signature_return_at = null;
        }

        const { error } = await supabase
            .from('assets_loans')
            .update(updateData)
            .eq('id', parseInt(loanId));

        if (error) {
            throw error;
        }
    },
};

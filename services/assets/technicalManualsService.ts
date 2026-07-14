import { supabase } from '../supabase';
import { r2Service } from '../r2Service';
import { TechnicalManual, TechnicalManualType, TechnicalManualFile, TechnicalManualAsset } from '../../types';

export const technicalManualsService = {
    // ── Technical Manuals CRUD ──────────────────────────────────────────

    async getTechnicalManuals(
        filter: 'all' | 'active' | 'inactive' = 'all',
        search: string = '',
        assetTypeId?: string
    ): Promise<TechnicalManual[]> {
        let query = supabase
            .from('v_technicals_manuals')
            .select('*')
            .order('tm_description');

        if (assetTypeId) {
            query = query.eq('asset_type_id', parseInt(assetTypeId));
        }

        if (search) {
            query = query.or(`tm_description.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching technical manuals:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            code: item.code || '',
            description: item.tm_description || '',
            tmTypeId: item.tm_type_id?.toString() || '',
            tmTypeDescription: item.tm_type_description || '',
            assetTypeId: item.asset_type_id?.toString() || '',
            assetTypeDescription: item.asset_type_description || '',
            companyId: item.company_id?.toString() || '',
            assetsAmount: item.assets_amount || 0,
            docFilePath: item.doc_file_path || '',
            docFileName: item.doc_file_name || ''
        })) as TechnicalManual[];
    },

    async getTechnicalManualById(id: string): Promise<TechnicalManual | null> {
        const { data, error } = await supabase
            .from('v_technicals_manuals')
            .select('*')
            .eq('id', parseInt(id))
            .single();

        if (error) {
            console.error('Error fetching technical manual:', error);
            throw error;
        }

        if (!data) return null;

        // Fetch associated files
        const files = await this.getTechnicalManualFiles(id);

        return {
            id: data.id.toString(),
            code: data.code || '',
            description: data.tm_description || '',
            tmTypeId: data.tm_type_id?.toString() || '',
            tmTypeDescription: data.tm_type_description || '',
            assetTypeId: data.asset_type_id?.toString() || '',
            assetTypeDescription: data.asset_type_description || '',
            companyId: data.company_id?.toString() || '',
            assetsAmount: data.assets_amount || 0,
            docFilePath: data.doc_file_path || '',
            docFileName: data.doc_file_name || '',
            files
        } as TechnicalManual & { files: TechnicalManualFile[] };
    },

    async createTechnicalManual(tm: Partial<TechnicalManual>): Promise<TechnicalManual> {
        const dbData = {
            code: tm.code || null,
            description: tm.description,
            tm_type_id: parseInt(tm.tmTypeId),
            asset_type_id: parseInt(tm.assetTypeId),
            company_id: tm.companyId ? parseInt(tm.companyId) : null,
            assets_amount: 0
        };

        const { data, error } = await supabase
            .from('technicals_manuals')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...tm,
            id: data.id.toString(),
            assetsAmount: 0
        } as TechnicalManual;
    },

    async updateTechnicalManual(id: string, tm: Partial<TechnicalManual>): Promise<TechnicalManual> {
        const dbData: any = {};

        if (tm.code !== undefined) dbData.code = tm.code || null;
        if (tm.description !== undefined) dbData.description = tm.description;
        if (tm.tmTypeId !== undefined) dbData.tm_type_id = parseInt(tm.tmTypeId);
        if (tm.assetTypeId !== undefined) dbData.asset_type_id = parseInt(tm.assetTypeId);

        const { data, error } = await supabase
            .from('technicals_manuals')
            .update(dbData)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) throw error;

        return {
            ...tm,
            id: data.id.toString()
        } as TechnicalManual;
    },

    async deleteTechnicalManual(id: string): Promise<void> {
        // First delete associated files from R2
        const files = await this.getTechnicalManualFiles(id);
        for (const file of files) {
            try {
                await this.deleteTechnicalManualFile(file.id);
            } catch (e) {
                console.error('Error deleting file from R2:', e);
            }
        }

        const { error } = await supabase
            .from('technicals_manuals')
            .delete()
            .eq('id', parseInt(id));

        if (error) throw error;
    },

    // ── Technical Manual Types ──────────────────────────────────────────

    async getTechnicalManualTypes(): Promise<TechnicalManualType[]> {
        const { data, error } = await supabase
            .from('technicals_manuals_types')
            .select('*')
            .eq('is_deleted', false)
            .order('description');

        if (error) {
            console.error('Error fetching technical manual types:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            description: item.description,
            isDeleted: item.is_deleted
        })) as TechnicalManualType[];
    },

    async createTechnicalManualType(tmType: Partial<TechnicalManualType>): Promise<TechnicalManualType> {
        const { data, error } = await supabase
            .from('technicals_manuals_types')
            .insert({ description: tmType.description })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id.toString(),
            description: data.description,
            isDeleted: data.is_deleted
        } as TechnicalManualType;
    },

    // ── Technical Manual Files ──────────────────────────────────────────

    async getTechnicalManualFiles(tmId: string): Promise<TechnicalManualFile[]> {
        const { data, error } = await supabase
            .from('technicals_manuals_files')
            .select('*')
            .eq('tm_id', parseInt(tmId))
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching technical manual files:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            tmId: item.tm_id.toString(),
            docFilePath: item.doc_file_path || '',
            docFileName: item.doc_file_name || '',
            fileType: item.file_type || 'pdf',
            createdAt: item.created_at
        })) as TechnicalManualFile[];
    },

    async uploadTechnicalManualFile(
        tmId: string,
        file: File,
        companyId: string = '1'
    ): Promise<TechnicalManualFile> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const folderPath = `companies/${companyId}/technical-manuals/${tmId}`;
        const fullPath = `${folderPath}/${fileName}`;

        // Determine file type
        let fileType: 'image' | 'pdf' | 'doc' | 'excel' = 'pdf';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.includes('word') || file.type.includes('document')) fileType = 'doc';
        else if (file.type.includes('sheet') || file.type.includes('excel')) fileType = 'excel';

        try {
            await r2Service.uploadFile(file, fullPath);
        } catch (uploadError) {
            console.error('Error uploading file to R2:', uploadError);
            throw uploadError;
        }

        // Save file record in DB
        const { data, error } = await supabase
            .from('technicals_manuals_files')
            .insert({
                tm_id: parseInt(tmId),
                doc_file_path: folderPath,
                doc_file_name: fileName,
                file_type: fileType
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id.toString(),
            tmId: data.tm_id.toString(),
            docFilePath: data.doc_file_path,
            docFileName: data.doc_file_name,
            fileType: data.file_type,
            createdAt: data.created_at
        } as TechnicalManualFile;
    },

    async deleteTechnicalManualFile(fileId: string): Promise<void> {
        // Get file info first
        const { data: fileData, error: fetchError } = await supabase
            .from('technicals_manuals_files')
            .select('*')
            .eq('id', parseInt(fileId))
            .single();

        if (fetchError) throw fetchError;

        // Delete from R2 if path exists
        if (fileData?.doc_file_path && fileData?.doc_file_name) {
            try {
                await r2Service.deleteFile(`${fileData.doc_file_path}/${fileData.doc_file_name}`);
            } catch (e) {
                console.error('Error deleting file from R2:', e);
            }
        }

        // Delete from DB
        const { error } = await supabase
            .from('technicals_manuals_files')
            .delete()
            .eq('id', parseInt(fileId));

        if (error) throw error;
    },

    // ── Asset Association ───────────────────────────────────────────────

    async getAssociatedAssets(tmId: string): Promise<TechnicalManualAsset[]> {
        const { data, error } = await supabase
            .from('technicals_manuals_assets')
            .select('*')
            .eq('tm_id', parseInt(tmId));

        if (error) {
            console.error('Error fetching associated assets:', error);
            throw error;
        }

        if (!data || data.length === 0) return [];

        const assetIds = data.map((item: any) => item.asset_id);
        const { data: assets, error: assetsError } = await supabase
            .from('v_assets')
            .select('id, code, description, status_description, tag_description, tag_sub_description, unit_id')
            .in('id', assetIds);

        if (assetsError) {
            console.error('Error fetching asset details:', assetsError);
        }

        const unitIds = [...new Set((assets || []).map((a: any) => a.unit_id).filter(Boolean))];
        const { data: unitsData } = unitIds.length > 0
            ? await supabase.from('v_units').select('id, client_name, description_full').in('id', unitIds)
            : { data: [] };

        const unitsMap = new Map(unitsData?.map((u: any) => [u.id.toString(), u]) || []);
        const assetMap = new Map<string, any>();
        if (assets) {
            assets.forEach((a: any) => assetMap.set(a.id.toString(), a));
        }

        return data.map((item: any) => {
            const asset = assetMap.get(item.asset_id.toString());
            const unit = asset?.unit_id ? unitsMap.get(asset.unit_id.toString()) : null;
            return {
                id: item.id.toString(),
                tmId: item.tm_id.toString(),
                assetId: item.asset_id.toString(),
                versionMode: item.version_mode,
                assetCode: asset?.code || '',
                assetDescription: asset?.description || '',
                assetStatusName: asset?.status_description || '',
                clientName: unit?.client_name || '',
                unitDescription: unit?.description_full || '',
                tagDescription: asset?.tag_description || '',
                tagSubDescription: asset?.tag_sub_description || ''
            };
        }) as TechnicalManualAsset[];
    },

    async associateAsset(tmId: string, assetId: string): Promise<void> {
        // Check if already associated
        const { data: existing } = await supabase
            .from('technicals_manuals_assets')
            .select('id')
            .eq('tm_id', parseInt(tmId))
            .eq('asset_id', parseInt(assetId))
            .single();

        if (existing) return; // Already associated

        const { error } = await supabase
            .from('technicals_manuals_assets')
            .insert({
                tm_id: parseInt(tmId),
                asset_id: parseInt(assetId)
            });

        if (error) throw error;

        // Update assets_amount counter
        await this.updateAssetsAmount(tmId);
    },

    async dissociateAsset(tmId: string, assetId: string): Promise<void> {
        const { error } = await supabase
            .from('technicals_manuals_assets')
            .delete()
            .eq('tm_id', parseInt(tmId))
            .eq('asset_id', parseInt(assetId));

        if (error) throw error;

        // Update assets_amount counter
        await this.updateAssetsAmount(tmId);
    },

    async updateAssetsAmount(tmId: string): Promise<void> {
        const { count, error: countError } = await supabase
            .from('technicals_manuals_assets')
            .select('*', { count: 'exact', head: true })
            .eq('tm_id', parseInt(tmId));

        if (countError) throw countError;

        const { error } = await supabase
            .from('technicals_manuals')
            .update({ assets_amount: count || 0 })
            .eq('id', parseInt(tmId));

        if (error) throw error;
    },

    async getAssetsByTypeForAssociation(
        assetTypeId: string,
        search: string = '',
        excludeTmId?: string,
        clientId?: string,
        unitId?: string
    ): Promise<{ id: string; code: string; description: string; tagDescription?: string; tagSubDescription?: string; statusDescription?: string }[]> {
        let query = supabase
            .from('assets')
            .select('id, code, description')
            .eq('type_id', parseInt(assetTypeId))
            .eq('is_deleted', false)
            .order('code');

        if (search) {
            query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (clientId) {
            query = query.eq('client_id', parseInt(clientId));
        }

        if (unitId) {
            query = query.eq('unit_id', parseInt(unitId));
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching assets by type:', error);
            throw error;
        }

        if (!data || data.length === 0) return [];

        const assetIds = data.map((item: any) => item.id);

        const { data: vAssets, error: vAssetsError } = await supabase
            .from('v_assets')
            .select('id, tag_description, tag_sub_description, status_description')
            .in('id', assetIds);

        if (vAssetsError) {
            console.error('Error fetching v_assets:', vAssetsError);
        }

        const vAssetsMap = new Map(vAssets?.map((v: any) => [v.id.toString(), v]) || []);

        return data.map((item: any) => {
            const vAsset = vAssetsMap.get(item.id.toString());
            return {
                id: item.id.toString(),
                code: item.code,
                description: item.description,
                tagDescription: vAsset?.tag_description || '',
                tagSubDescription: vAsset?.tag_sub_description || '',
                statusDescription: vAsset?.status_description || ''
            };
        });
    }
};

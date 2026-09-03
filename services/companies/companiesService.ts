import { supabase } from '../supabase';
import { r2Service } from '../r2Service';
import { Company, Client, Contract, ContractManager, ContractService, Department, Profile, Permission, Unit, OrderVisit, User } from '../../types';
import { getPublicImageUrl } from '../imageUtils';
import { getBrazilTimestamp } from '../../utils/dateUtils';
import { usersService } from '../users/usersService';

export const companiesService = {
    async getCompanies(): Promise<Company[]> {
        const { data: companies, error } = await supabase
            .from('v_companies')
            .select('*');

        if (error) {
            console.error('Error fetching companies:', error);
            throw error;
        }

        return companies.map((item: any) => {
            let logoUrl = undefined;
            if (item.img_file_name) {
                logoUrl = getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 200, height: 200, resize: 'contain' });
            }

            return {
                id: item.id.toString(),
                name: item.description,
                code: item.code,
                providerCompanyCode: item.provider_company_code,
                emailSuffix: item.email_sufix,
                logoPath: item.img_file_path,
                logoName: item.img_file_name,
                status: item.is_available ? 'active' : 'inactive',
                logoUrl: logoUrl || 'https://via.placeholder.com/150',
                category: 'Empresa',
                cnpj: item.code,
                phone: '',
                location: 'Localização não definida',
                contractCount: 0
            };
        }) as Company[];
    },


    async getCompanyById(id: string): Promise<Company | null> {
        if (!id) return null;

        const { data, error } = await supabase
            .from('v_companies')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching company by id:', error);
            return null;
        }

        const item = data;
        return {
            id: item.id.toString(),
            name: item.description,
            code: item.code,
            providerCompanyCode: item.provider_company_code,
            emailSuffix: item.email_sufix,
            logoPath: item.img_file_path,
            logoName: item.img_file_name,
            status: item.is_available ? 'active' : 'inactive',
            logoUrl: getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'contain' }) || 'https://via.placeholder.com/150',
            category: 'Empresa',
            cnpj: item.code,
            phone: '',
            location: 'Localização não definida',
            contractCount: 0
        };
    },

    async createCompany(company: Partial<Company>, onProgress?: (progress: number) => void): Promise<Company> {
        const dbData = {
            description: company.name,
            code: company.code,
            email_sufix: company.emailSuffix,
            is_available: company.status === 'active',
            img_file_path: company.logoUrl?.startsWith('data:') ? null : company.logoUrl,
        };

        const { data: newCompany, error: insertError } = await supabase
            .from('cfg_companies')
            .insert(dbData)
            .select()
            .single();

        if (insertError) throw insertError;

        const companyId = newCompany.id;

        try {
            await supabase
                .from('clients')
                .insert({
                    name: company.name,
                    code: company.code,
                    is_available: true,
                    company_id: companyId,
                    is_deleted: false
                });
        } catch (clientErr) {
            console.error("Failed to create partner client for new company", clientErr);
        }

        if (company.logoUrl && company.logoUrl.startsWith('data:')) {
            try {
                const folderPath = `companies/${companyId}/logo`;
                const fileName = `${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                const res = await fetch(company.logoUrl);
                const blob = await res.blob();

                await r2Service.uploadFile(blob as any, fullPath, onProgress);

                const { error: updateError } = await supabase
                    .from('cfg_companies')
                    .update({
                        img_file_path: folderPath,
                        img_file_name: fileName
                    })
                    .eq('id', companyId);

                if (updateError) {
                    console.error("Failed to update company logo path", updateError);
                }
            } catch (err) {
                console.error("Failed to process logo upload to R2", err);
            }
        }

        return {
            ...company,
            id: companyId.toString(),
        } as Company;
    },

    async updateCompany(id: string, company: Partial<Company>, onProgress?: (progress: number) => void): Promise<Company> {
        const dbData = {
            description: company.name,
            code: company.code,
            email_sufix: company.emailSuffix,
            is_available: company.status === 'active'
        };

        let oldLogoPath = null;
        if (company.logoUrl && company.logoUrl.startsWith('data:')) {
            const { data: currentComp } = await supabase
                .from('cfg_companies')
                .select('img_file_path, img_file_name')
                .eq('id', id)
                .single();
            if (currentComp?.img_file_path && currentComp?.img_file_name) {
                oldLogoPath = `${currentComp.img_file_path}/${currentComp.img_file_name}`;
            }
        }

        const { error: updateError } = await supabase
            .from('cfg_companies')
            .update(dbData)
            .eq('id', id);

        if (updateError) throw updateError;

        if (company.logoUrl && company.logoUrl.startsWith('data:')) {
            try {
                const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';
                const folderPath = `companies/${id}/logo`;
                const fileName = `${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                const res = await fetch(company.logoUrl);
                const blob = await res.blob();

                await r2Service.uploadFile(blob as any, fullPath, onProgress);

                await supabase
                    .from('cfg_companies')
                    .update({
                        img_file_path: folderPath,
                        img_file_name: fileName
                    })
                    .eq('id', id);

                if (oldLogoPath) {
                    await supabase.storage
                        .from(bucketName)
                        .remove([oldLogoPath]);
                }
            } catch (err) {
                console.error("Failed to process new logo upload/old logo deletion", err);
            }
        }

        return { ...company, id } as Company;
    },

    async deleteCompany(id: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_companies')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getContracts(ids?: (string | number)[]): Promise<Contract[]> {
        let query = supabase.from('contracts').select('*');
        if (ids && ids.length > 0) {
            query = query.in('id', ids.map(id => id.toString()));
        }
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching contracts:', error);
            return [];
        }

        const companiesData = await companiesService.getCompanies();
        const companyMap = new Map<string, Company>(companiesData.map(c => [c.id, c]));

        return data.map((item: any) => {
            const providerCompany = companyMap.get(item.provider_company_id?.toString());
            const providerCode = providerCompany?.providerCompanyCode || providerCompany?.code || '';
            const description = item.description && providerCode
                ? `${item.description} (${providerCode})`
                : item.description || item.code || 'S/N';

            let logoUrl = undefined;
            if (providerCompany?.logoUrl) {
                logoUrl = providerCompany.logoUrl;
            }

            return {
                id: item.id.toString(),
                clientCompanyId: item.client_company_id?.toString(),
                clientDepartmentId: item.client_department_id?.toString(),
                providerCompanyId: item.provider_company_id?.toString(),
                providerDepartmentId: item.provider_department_id?.toString(),
                clientId: item.client_id?.toString(),
                description,
                object: item.object,
                isAvailable: item.is_available ?? true,
                isDeleted: item.is_deleted,
                code: item.code,
                statusId: item.status_id,
                createdUserId: item.created_user_id?.toString(),
                createdDate: item.created_date,
                updatedUserId: item.updated_user_id?.toString(),
                updatedDate: item.updated_date,
                deletedUserId: item.deleted_user_id?.toString(),
                deletedDate: item.deleted_date,
                isDev: item.is_dev,
                version: item.version,
                defaultOvAssetId: item.default_ov_asset_id?.toString(),
                defaultActivityId: item.default_activity_id?.toString(),
                dateStart: item.date_start,
                dateEnd: item.date_end,
                totalValue: item.total_value,
                clientCompanyName: companyMap.get(item.client_company_id?.toString())?.name || 'N/A',
                providerCompanyName: providerCompany?.name || 'N/A',
                providerCompanyCode: providerCode,
                clientDepartmentName: companyMap.get(item.client_department_id?.toString())?.name,
                providerDepartmentName: companyMap.get(item.provider_department_id?.toString())?.name,
                logoUrl
            };
        }) as Contract[];
    },

    async getContractById(id: string): Promise<Contract | null> {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching contract by id:', error);
            return null;
        }

        return {
            id: data.id.toString(),
            clientCompanyId: data.client_company_id?.toString(),
            clientDepartmentId: data.client_department_id?.toString(),
            providerCompanyId: data.provider_company_id?.toString(),
            providerDepartmentId: data.provider_department_id?.toString(),
            clientId: data.client_id?.toString(),
            description: data.description,
            object: data.object,
            isAvailable: data.is_available,
            isDeleted: data.is_deleted,
            code: data.code,
            statusId: data.status_id,
        } as Contract;
    },

    async getContractsByClientDepartmentId(clientDepartmentId: string, clientId?: string): Promise<Contract[]> {
        const isClientDept = Number(clientDepartmentId) === 9;
        let query = supabase
            .from('v_contracts')
            .select('*')
            .eq(isClientDept ? 'client_department_id' : 'provider_department_id', clientDepartmentId)
            .eq('is_available', true)
            .eq('is_deleted', false);

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data, error } = await query.order('description');

        if (error) {
            console.error('Error fetching contracts by client:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            clientCompanyId: item.client_company_id?.toString(),
            clientDepartmentId: item.client_department_id?.toString(),
            providerCompanyId: item.provider_company_id?.toString(),
            providerDepartmentId: item.provider_department_id?.toString(),
            clientId: item.client_id?.toString(),
            description: item.description || item.code || 'S/N',
            object: item.object,
            isAvailable: item.is_available ?? true,
            isDeleted: item.is_deleted,
            code: item.code,
            statusId: item.status_id,
            createdUserId: item.created_user_id?.toString(),
            createdDate: item.created_date,
            updatedUserId: item.updated_user_id?.toString(),
            updatedDate: item.updated_date,
            deletedUserId: item.deleted_user_id?.toString(),
            deletedDate: item.deleted_date,
            isDev: item.is_dev,
            version: item.version,
            defaultOvAssetId: item.default_ov_asset_id?.toString(),
            defaultActivityId: item.default_activity_id?.toString(),
            dateStart: item.date_start,
            dateEnd: item.date_end,
            totalValue: item.total_value,
            clientCompanyName: item.client_company_description || 'N/A',
            providerCompanyName: item.provider_company_description || 'N/A',
            providerCompanyCode: item.provider_company_code || '',
            clientDepartmentName: undefined,
            providerDepartmentName: undefined,
            logoUrl: item.provider_company_img_file_path
                ? item.provider_company_img_file_path
                : undefined
        })) as Contract[];
    },

    async getContractsByClientId(clientId: string): Promise<Contract[]> {
        try {
            const user = await usersService.getCurrentUser();
            if (!user?.departmentId) return [];

            const isClientDept = Number(user.departmentId) === 9;
            const { data, error } = await supabase
                .from('v_contracts')
                .select('*')
                .eq(isClientDept ? 'client_department_id' : 'provider_department_id', user.departmentId)
                .eq('client_id', clientId)
                .eq('is_available', true)
                .eq('is_deleted', false)
                .order('description');

            if (error) {
                console.error('Error fetching contracts by client:', error);
                return [];
            }

            if (!data || data.length === 0) return [];

            return data.map((item: any) => ({
                id: item.id.toString(),
                clientCompanyId: item.client_company_id?.toString(),
                clientDepartmentId: item.client_department_id?.toString(),
                providerCompanyId: item.provider_company_id?.toString(),
                providerDepartmentId: item.provider_department_id?.toString(),
                clientId: item.client_id?.toString(),
                description: item.description || item.code || 'S/N',
                object: item.object,
                isAvailable: item.is_available ?? true,
                isDeleted: item.is_deleted,
                code: item.code,
                statusId: item.status_id,
                createdUserId: item.created_user_id?.toString(),
                createdDate: item.created_date,
                updatedUserId: item.updated_user_id?.toString(),
                updatedDate: item.updated_date,
                deletedUserId: item.deleted_user_id?.toString(),
                deletedDate: item.deleted_date,
                isDev: item.is_dev,
                version: item.version,
                defaultOvAssetId: item.default_ov_asset_id?.toString(),
                defaultActivityId: item.default_activity_id?.toString(),
                dateStart: item.date_start,
                dateEnd: item.date_end,
                totalValue: item.total_value,
                clientCompanyName: item.client_company_description || 'N/A',
                providerCompanyName: item.provider_company_description || 'N/A',
                providerCompanyCode: item.provider_company_code || '',
                clientDepartmentName: undefined,
                providerDepartmentName: undefined,
                logoUrl: item.provider_company_img_file_path
                    ? item.provider_company_img_file_path
                    : undefined
            })) as Contract[];

        } catch (error) {
            console.error('Erro fatal ao buscar contratos:', error);
            return [];
        }
    },

    async createContract(contract: Partial<Contract>): Promise<Contract> {
        const dbData = {
            client_company_id: contract.clientCompanyId ? parseInt(contract.clientCompanyId) : null,
            client_department_id: contract.clientDepartmentId ? parseInt(contract.clientDepartmentId) : null,
            provider_company_id: contract.providerCompanyId ? parseInt(contract.providerCompanyId) : null,
            provider_department_id: contract.providerDepartmentId ? parseInt(contract.providerDepartmentId) : null,
            client_id: contract.clientId ? parseInt(contract.clientId) : null,
            description: contract.description,
            object: contract.object,
            is_available: contract.isAvailable !== undefined ? contract.isAvailable : true,
            code: contract.code,
            status_id: contract.statusId,
            date_start: contract.dateStart,
            date_end: contract.dateEnd,
            total_value: contract.totalValue,
            is_dev: contract.isDev,
            version: contract.version,
            default_ov_asset_id: contract.defaultOvAssetId ? parseInt(contract.defaultOvAssetId) : null,
            default_activity_id: contract.defaultActivityId ? parseInt(contract.defaultActivityId) : null
        };

        const { data, error } = await supabase
            .from('contracts')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;

        return {
            ...contract,
            id: data.id.toString()
        } as Contract;
    },

    async updateContract(id: string, contract: Partial<Contract>): Promise<Contract> {
        const dbData: any = {};
        if (contract.clientCompanyId !== undefined) dbData.client_company_id = contract.clientCompanyId ? parseInt(contract.clientCompanyId) : null;
        if (contract.clientDepartmentId !== undefined) dbData.client_department_id = contract.clientDepartmentId ? parseInt(contract.clientDepartmentId) : null;
        if (contract.providerCompanyId !== undefined) dbData.provider_company_id = contract.providerCompanyId ? parseInt(contract.providerCompanyId) : null;
        if (contract.providerDepartmentId !== undefined) dbData.provider_department_id = contract.providerDepartmentId ? parseInt(contract.providerDepartmentId) : null;
        if (contract.clientId !== undefined) dbData.client_id = contract.clientId ? parseInt(contract.clientId) : null;
        if (contract.description !== undefined) dbData.description = contract.description;
        if (contract.object !== undefined) dbData.object = contract.object;
        if (contract.isAvailable !== undefined) dbData.is_available = contract.isAvailable;
        if (contract.code !== undefined) dbData.code = contract.code;
        if (contract.statusId !== undefined) dbData.status_id = contract.statusId;
        if (contract.dateStart !== undefined) dbData.date_start = contract.dateStart;
        if (contract.dateEnd !== undefined) dbData.date_end = contract.dateEnd;
        if (contract.totalValue !== undefined) dbData.total_value = contract.totalValue;
        if (contract.isDev !== undefined) dbData.is_dev = contract.isDev;
        if (contract.version !== undefined) dbData.version = contract.version;
        if (contract.defaultOvAssetId !== undefined) dbData.default_ov_asset_id = contract.defaultOvAssetId ? parseInt(contract.defaultOvAssetId) : null;
        if (contract.defaultActivityId !== undefined) dbData.default_activity_id = contract.defaultActivityId ? parseInt(contract.defaultActivityId) : null;

        const { data, error } = await supabase
            .from('contracts')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...contract,
            id: data.id.toString()
        } as Contract;
    },

    async deleteContract(id: string): Promise<void> {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getClients(): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('is_deleted', 'false');

        if (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            code: item.code,
            email: item.email,
            mobile: item.mobile,
            address: item.address,
            logoPath: item.img_file_path,
            logoName: item.img_file_name,
            status: item.is_available ? 'active' : 'inactive',
            logoUrl: getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 400, height: 400, resize: 'contain' }) || 'https://via.placeholder.com/150',
            category: 'Cliente',
            contractCount: 0,
            companyId: item.company_id?.toString()
        })) as Client[];
    },

    async createClient(client: Partial<Client>, onProgress?: (progress: number) => void): Promise<Client> {
        const currentUser = await usersService.getCurrentUser();

        const dbData = {
            name: client.name,
            code: client.code,
            email: client.email,
            mobile: client.mobile,
            address: client.address,
            is_available: true,
            img_file_path: client.logoUrl?.startsWith('data:') ? null : client.logoUrl,
            created_user_id: currentUser ? parseInt(currentUser.id) : null,
            is_deleted: false
        };

        const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert(dbData)
            .select()
            .single();

        if (insertError) throw insertError;

        const clientId = newClient.id;

        if (client.logoUrl && client.logoUrl.startsWith('data:')) {
            try {
                const folderPath = `clients/${clientId}`;
                const fileName = `avatar_${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                const res = await fetch(client.logoUrl);
                const blob = await res.blob();

                await r2Service.uploadFile(blob as any, fullPath, onProgress);

                await supabase
                    .from('clients')
                    .update({
                        img_file_path: folderPath,
                        img_file_name: fileName
                    })
                    .eq('id', clientId);
            } catch (err) {
                console.error("Failed to process client logo upload to R2", err);
            }
        }

        return { ...client, id: clientId.toString(), status: 'active' } as Client;
    },

    async updateClient(id: string, client: Partial<Client>, onProgress?: (progress: number) => void): Promise<Client> {
        const currentUser = await usersService.getCurrentUser();

        const dbData = {
            name: client.name,
            code: client.code,
            email: client.email,
            mobile: client.mobile,
            address: client.address,
            is_available: client.status === 'active',
            company_id: client.companyId ? parseInt(client.companyId) : null,
            updated_user_id: currentUser ? parseInt(currentUser.id) : null,
            updated_at: getBrazilTimestamp()
        };

        const { error: updateError } = await supabase
            .from('clients')
            .update(dbData)
            .eq('id', id);

        if (updateError) throw updateError;

        if (client.logoUrl && client.logoUrl.startsWith('data:')) {
            try {
                const folderPath = `clients/${id}`;
                const fileName = `avatar_${Date.now()}.jpg`;
                const fullPath = `${folderPath}/${fileName}`;

                const res = await fetch(client.logoUrl);
                const blob = await res.blob();

                await r2Service.uploadFile(blob as any, fullPath, onProgress);

                await supabase
                    .from('clients')
                    .update({
                        img_file_path: folderPath,
                        img_file_name: fileName
                    })
                    .eq('id', id);
            } catch (err) {
                console.error("Failed to process client logo update to R2", err);
            }
        }

        return { ...client, id } as Client;
    },

    async deleteClient(id: string): Promise<void> {
        const currentUser = await usersService.getCurrentUser();

        const { error } = await supabase
            .from('clients')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_user_id: currentUser ? parseInt(currentUser.id) : null
            })
            .eq('id', id);

        if (error) throw error;
    },

    async getUnitsByClient(clientId: string): Promise<Unit[]> {
        const { data: units, error: unitsError } = await supabase
            .from('units')
            .select('id, client_id, description, code, installation_code_power_supply, address_full, latitude, longitude, unit_type_parent_id, unit_type_id, system_parent_id, system_id, status_id, img_file_path, img_file_name, description_full')
            .eq('client_id', clientId)
            .eq('is_deleted', 'false');

        if (unitsError) {
            console.error('Error fetching units:', unitsError);
            throw unitsError;
        }

        const [
            { data: unitTypes },
            { data: systems },
            { data: statuses }
        ] = await Promise.all([
            supabase.from('cfg_units_types').select('id, description'),
            supabase.from('cfg_systems').select('id, description'),
            supabase.from('v_units_statuses').select('id, description')
        ]);

        const typesMap = new Map(unitTypes?.map(t => [t.id, t.description]));
        const systemsMap = new Map(systems?.map(s => [s.id, s.description]));
        const statusesMap = new Map(statuses?.map(st => [st.id, st.description]));

        return (units || []).map((item: any) => {
            return {
                id: item.id.toString(),
                clientId: item.client_id.toString(),
                description: item.description,
                code: item.code,
                installationCodePowerSupply: item.installation_code_power_supply,
                addressFull: item.address_full,
                latitude: item.latitude,
                longitude: item.longitude,
                unitTypeParentId: item.unit_type_parent_id?.toString(),
                unitTypeId: item.unit_type_id?.toString(),
                typeName: typesMap.get(item.unit_type_parent_id),
                subTypeName: typesMap.get(item.unit_type_id),
                systemParentId: item.system_parent_id?.toString(),
                systemId: item.system_id?.toString(),
                systemParentName: systemsMap.get(item.system_parent_id),
                systemName: systemsMap.get(item.system_id),
                imgFilePath: item.img_file_path,
                imgFileName: item.img_file_name,
                statusId: item.status_id?.toString() || '1',
                statusName: statusesMap.get(item.status_id),
                logoUrl: getPublicImageUrl(item.img_file_path, item.img_file_name, {
                    width: 400,
                    height: 400,
                    resize: 'cover'
                }),
                descriptionFull: item.description_full
            };
        }) as Unit[];
    },

    async updateContractService(id: string, item: Partial<ContractService>): Promise<void> {
        const dbData: any = {};
        if (item.valueUnit !== undefined) dbData.value_unit = item.valueUnit;
        if (item.discount !== undefined) dbData.discount = item.discount;
        if (item.amount !== undefined) dbData.amount = item.amount;

        const { error } = await supabase
            .from('contracts_services')
            .update(dbData)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteContractService(id: string): Promise<void> {
        const { error } = await supabase
            .from('contracts_services')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getContractManagers(contractId: string): Promise<ContractManager[]> {
        const { data: relations, error } = await supabase
            .from('contracts_managers')
            .select('*')
            .eq('contract_id', contractId)
            .eq('is_deleted', 'false');

        if (error) {
            console.error('Error fetching contract managers relations:', error);
            throw error;
        }

        if (!relations || relations.length === 0) return [];

        const userIds = relations.map(r => r.manager_id);

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);

        if (usersError) {
            console.error('Error fetching manager details:', usersError);
            throw usersError;
        }

        const userMap = new Map<string, any>(users.map((u: any) => [u.id.toString(), u]));

        return relations.map(r => {
            const user = userMap.get(r.manager_id.toString());
            return {
                id: r.id.toString(),
                contractId: r.contract_id.toString(),
                managerId: r.manager_id.toString(),
                isDeleted: r.is_deleted,
                role: r.role,
                versionMode: r.version_mode,
                createdAt: r.created_at,
                managerName: user?.name_short || user?.name_full,
                managerEmail: user?.email,
                managerAvatarUrl: user?.img_file_name
                    ? getPublicImageUrl(user.img_file_path, user.img_file_name)
                    : undefined,
                isAdminSuper: user?.is_admin_super ?? false
            };
        });
    },

    async getManagedContracts(userId: string): Promise<Contract[]> {
        const { data: managed, error } = await supabase
            .from('contracts_managers')
            .select('contract_id')
            .eq('manager_id', userId)
            .eq('is_deleted', false)
            .in('role', ['manager', 'viewer']);

        if (error || !managed || managed.length === 0) return [];

        const contractIds = managed.map(m => m.contract_id.toString());
        return companiesService.getContracts(contractIds);
    },

    async isUserContractManager(userId: string, contractId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('contracts_managers')
            .select('id')
            .eq('contract_id', contractId)
            .eq('manager_id', userId)
            .eq('role', 'manager')
            .eq('is_deleted', false)
            .maybeSingle();

        if (error) {
            console.error('Error checking if user is contract manager:', error);
            return false;
        }

        return !!data;
    },

    async addContractManager(contractId: string, managerId: string, role: string = 'viewer'): Promise<void> {
        const { data: existingFollow, error: checkError } = await supabase
            .from('contracts_managers')
            .select('id, is_deleted')
            .eq('contract_id', contractId)
            .eq('manager_id', managerId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingFollow) {
            if (existingFollow.is_deleted) {
                const { error } = await supabase
                    .from('contracts_managers')
                    .update({
                        is_deleted: false,
                        deleted_at: null,
                        deleted_user_id: null,
                        role
                    })
                    .eq('id', existingFollow.id);
                if (error) throw error;
            } else {
                await supabase
                    .from('contracts_managers')
                    .update({ role })
                    .eq('id', existingFollow.id);
            }
            return;
        }

        const { error } = await supabase
            .from('contracts_managers')
            .insert({
                contract_id: contractId,
                manager_id: managerId,
                is_deleted: false,
                role
            });

        if (error) throw error;
    },

    async removeContractManager(contractId: string, managerId: string): Promise<void> {
        const { error } = await supabase
            .from('contracts_managers')
            .update({
                is_deleted: true,
                deleted_at: getBrazilTimestamp()
            })
            .eq('contract_id', contractId)
            .eq('manager_id', managerId);

        if (error) throw error;
    },

    async getLeadersByCompany(companyId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*, cfg_users_statuses(id, description), cfg_profiles(description)')
            .eq('company_id', companyId)
            .eq('is_team_leader', true)
            .eq('status_id', 2)
            .order('name_short', { ascending: true });

        if (error) {
            console.error('Error fetching leaders by company:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            id: item.id.toString(),
            uuid: item.uuid,
            email: item.email,
            latitude: item.latitude,
            longitude: item.longitude,
            trackerHeartbeatAt: item.tracker_heartbeat_at,
            nameFull: item.name_full,
            nameShort: item.name_short,
            statusId: item.status_id,
            statusName: item.cfg_users_statuses?.description || 'Desconhecido',
            profileId: item.profile_id?.toString(),
            profileName: item.cfg_profiles?.description,
            mobile: item.mobile,
            phone: item.phone,
            isAvailable: item.is_available,
            ovIdInProgress: item.ov_id_in_progress,
            companyId: item.company_id?.toString(),
            avatarUrl: getPublicImageUrl(item.img_file_path, item.img_file_name, { width: 100, height: 100, resize: 'cover' })
        })) as User[];
    },

    async getTodayVisitsByCompany(companyId: string): Promise<OrderVisit[]> {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data, error } = await supabase
            .from('v_orders_visits')
            .select('*')
            .eq('o_provider_company_id', companyId)
            .or(`ov_status_id.eq.1,and(ov_status_id.eq.2,ov_started_at.gte.${startOfDay},ov_started_at.lte.${endOfDay})`)
            .order('ov_started_at', { ascending: true });

        if (error) {
            console.error('Error fetching today visits by company:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            oId: row.o_id?.toString(),
            ovMask: row.ov_mask,
            ovStatusId: row.ov_status_id,
            ovProcessingId: row.ov_processing_id,
            ovCreatedAt: row.ov_created_at,
            ovCreatedUserId: row.ov_created_user_id?.toString(),
            ovTeamLeadId: row.ov_team_leader_id?.toString(),
            ovStartedAt: row.ov_started_at,
            ovEndedAt: row.ov_ended_at,
            unitDescription: row.o_unit_description,
            systemDescription: row.o_system_description,
            clientName: row.o_client_name,
            teamLeaderName: row.ov_team_leader_name_short,
            statusDescription: row.ov_status_description,
            processingDescription: row.ov_processing_description,
            statusIcon: row.ov_status_icon,
            statusColor: row.ov_status_color,
            unitId: row.o_unit_id?.toString(),
            orderMask: row.o_mask,
            teamCode: row.o_team_code,
            contractDescription: row.o_contract_description,
            planDescription: row.o_plan_description,
            requestedServices: row.o_requested_services,
            ovOStatusId: row.ov_o_status_id,
            ovOStatusDescription: row.ov_o_status_description,
            ovOSuspendedReasonId: row.ov_o_suspended_reason_id,
            ovOSuspendedReasonDescription: row.ov_o_suspended_reason_description
        })) as OrderVisit[];
    },

    async getProviderCompanyByOvAssetId(ovAssetId: string): Promise<string | null> {
        const { data: ova, error: ovaError } = await supabase
            .from('orders_visits_assets')
            .select('ov_id')
            .eq('id', parseInt(ovAssetId))
            .single();

        if (ovaError || !ova) return null;

        const { data: visit, error: visitError } = await supabase
            .from('v_orders_visits')
            .select('o_provider_company_id')
            .eq('id', ova.ov_id)
            .single();

        if (visitError || !visit) return null;

        return visit.o_provider_company_id?.toString() || null;
    },

    async getCompanyProfiles(companyId: string): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('cfg_profiles')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            companyId: item.company_id.toString(),
            description: item.description,
            isAvailable: item.is_available,
            createdAt: item.created_at
        })) as Profile[];
    },

    async getAllProfiles(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('cfg_profiles')
            .select('*, cfg_departments(company_id)');

        if (error) {
            console.error('Error fetching all profiles:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id.toString(),
            companyId: item.cfg_departments?.company_id?.toString() || '',
            departmentId: item.department_id?.toString() || '',
            description: item.description,
            isAvailable: true,
            createdAt: item.created_at
        })) as Profile[];
    },

    async createCompanyProfile(companyId: string, description: string, permissions: Partial<Permission>[]): Promise<void> {
        const { data: profile, error: profileError } = await supabase
            .from('cfg_profiles')
            .insert({
                department_id: parseInt(companyId),
                description,
                is_available: true
            })
            .select()
            .single();

        if (profileError) throw profileError;

        if (permissions.length > 0) {
            const permsData = permissions.map(p => ({
                profile_id: profile.id,
                can_view: p.canView ?? false,
                can_create: p.canCreate ?? false,
                can_edit: p.canEdit ?? false,
                can_delete: p.canDelete ?? false
            }));

            const { error: permsError } = await supabase
                .from('cfg_profiles_access')
                .insert(permsData);

            if (permsError) throw permsError;
        }
    },

    async updateCompanyProfile(profileId: string, description: string, permissions: Partial<Permission>[]): Promise<void> {
        const { error: profileError } = await supabase
            .from('cfg_profiles')
            .update({ description })
            .eq('id', profileId);

        if (profileError) throw profileError;

        await supabase
            .from('cfg_profiles_access')
            .delete()
            .eq('profile_id', profileId);

        if (permissions.length > 0) {
            const permsData = permissions.map(p => ({
                profile_id: parseInt(profileId),
                can_view: p.canView ?? false,
                can_create: p.canCreate ?? false,
                can_edit: p.canEdit ?? false,
                can_delete: p.canDelete ?? false
            }));

            const { error: permsError } = await supabase
                .from('cfg_profiles_access')
                .insert(permsData);

            if (permsError) throw permsError;
        }
    },

    async deleteCompanyProfile(profileId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_profiles')
            .delete()
            .eq('id', profileId);
        if (error) throw error;
    },

    async checkContractUsesManus(contractId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('is_use_manus')
                .eq('id', contractId)
                .single();

            if (error) {
                console.error('Error checking contract Manus flag:', error);
                return false;
            }

            return data?.is_use_manus || false;
        } catch (error) {
            console.error('Error checking contract Manus flag:', error);
            return false;
        }
    },
    async getContractServices(contractId: string): Promise<ContractService[]> {
        const { data, error } = await supabase
            .from('v_contracts_services')
            .select('*')
            .eq('contract_id', contractId);

        if (error) { console.error('Error fetching contract services:', error); throw error; }
        if (!data || data.length === 0) return [];

        return data.map((item: any) => ({
            id: item.id.toString(),
            contractId: item.contract_id.toString(),
            serviceId: item.service_id.toString(),
            valueUnit: Number(item.value_unit),
            discount: Number(item.discount),
            amount: Number(item.amount),
            valueTotal: Number(item.value_total),
            isAvailable: item.is_available,
            isDeleted: item.is_deleted,
            versionMode: item.version_mode,
            serviceDescription: item.description,
            serviceCode: item.code,
            serviceUnit: item.unit
        })) as ContractService[];
    },

    async addContractService(item: Partial<ContractService>): Promise<void> {
        const { error } = await supabase.from('contracts_services').insert({
            contract_id: Number(item.contractId),
            service_id: Number(item.serviceId),
            value_unit: item.valueUnit,
            discount: item.discount,
            amount: item.amount
        });
        if (error) throw error;
    }

};

-- Expande v_units para ser a fonte de dados da busca de unidades.
-- Preserva as colunas existentes na mesma ordem e acrescenta os campos
-- necessários para escopo por cliente, disponibilidade e imagens.
-- LEFT JOINs mantêm unidades mesmo quando não há registro relacionado completo.
--
-- Aplicar manualmente apos 20261043_scope_v_orders_parent_for_providers.sql.

SET lock_timeout = '5s';

CREATE OR REPLACE VIEW public.v_units
WITH (security_invoker = 'true') AS
SELECT
    units.id,
    units.code,
    units.company_id,
    cfg_companies.code AS company_code,
    cfg_companies.description AS company_description,
    units.system_parent_id,
    systems_parent.code AS system_parent_code,
    systems_parent.description AS system_parent_description,
    units.system_id,
    systems_child.code AS system_child_code,
    systems_child.description AS system_child_description,
    units.unit_type_parent_id,
    units_types_parent.code AS unit_type_parent_code,
    units_types_parent.description AS unit_type_parent_description,
    units.unit_type_id,
    units_types_child.code AS unit_type_child_code,
    units_types_child.description AS unit_type_child_description,
    units.status_id,
    cfg_units_statuses.description AS status_description,
    units.description,
    units.description_full,
    units.street_name,
    units.street_number,
    units.street_complement,
    units.address_full,
    units.latitude,
    units.longitude,
    units.installation_code_power_supply,
    units.version_mode,
    units.client_id,
    clients.name AS client_name,
    units.clients_ids,
    units.is_deleted,
    units.is_available,
    units.img_file_path,
    units.img_file_name
FROM public.units
LEFT JOIN public.cfg_companies ON units.company_id = cfg_companies.id
LEFT JOIN public.cfg_systems AS systems_child ON units.system_id = systems_child.id
LEFT JOIN public.cfg_systems AS systems_parent ON units.system_parent_id = systems_parent.id
LEFT JOIN public.cfg_units_types AS units_types_parent ON units.unit_type_parent_id = units_types_parent.id
LEFT JOIN public.cfg_units_types AS units_types_child ON units.unit_type_id = units_types_child.id
LEFT JOIN public.cfg_units_statuses ON units.status_id = cfg_units_statuses.id
LEFT JOIN public.clients ON units.client_id = clients.id
ORDER BY units.description;

NOTIFY pgrst, 'reload schema';

-- Fix: Add missing amount and value_total columns to v_contracts_services view
-- The view was missing these columns, causing QTE PREV and Total Previsto to show as NaN

DROP FUNCTION IF EXISTS public.fc_contracts_services_search(text, integer);
DROP VIEW IF EXISTS public.v_contracts_services CASCADE;

CREATE VIEW public.v_contracts_services AS
 SELECT contracts_services.id,
    contracts_services.contract_id,
    contracts_services.service_id,
    cfg_services.code,
    cfg_services.description,
    cfg_services.unit,
    contracts_services.value_unit,
    contracts_services.discount,
    contracts_services.amount,
    contracts_services.value_total,
    contracts_services.version_mode
   FROM (public.contracts_services
     JOIN public.cfg_services ON ((contracts_services.service_id = cfg_services.id)))
  WHERE (contracts_services.is_deleted = false)
  ORDER BY cfg_services.description;

CREATE FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) RETURNS SETOF public.v_contracts_services
    LANGUAGE plpgsql
    AS $$
DECLARE
    result_record v_contracts_services;
BEGIN    
    FOR result_record IN
        SELECT *
        FROM v_contracts_services
        WHERE contract_id = contract_id_value AND
        to_tsvector('portuguese', v_contracts_services.description) @@ plainto_tsquery('portuguese', search_terms)
    LOOP
        RETURN NEXT result_record;
    END LOOP;
    RETURN;
END;
$$;

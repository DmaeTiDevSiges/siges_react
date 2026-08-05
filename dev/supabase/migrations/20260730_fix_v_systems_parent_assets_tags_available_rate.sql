-- Fix: Remove visibility flags from GROUP BY to avoid duplicate sector rows.
-- Previously, different visibility configurations per unit caused the same
-- sector (e.g. BOMBEAMENTO) to appear multiple times with different percentages.

DROP VIEW IF EXISTS public.v_systems_parent_assets_tags_available_rate;

CREATE VIEW public.v_systems_parent_assets_tags_available_rate AS
 SELECT v.system_parent_id,
    v.asset_tag_id,
    v.asset_tag_description,
    bool_or(v.flow_rate_is_visible) AS flow_rate_is_visible,
    (sum(v.total_flow_rate_max))::numeric AS total_flow_rate_max,
    (sum(v.total_flow_rate_last))::numeric AS total_flow_rate_last,
    MAX(v.flow_rate_unit) AS flow_rate_unit,
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric)
        END AS pct_flow_rate_available_fraction,
    (
        CASE
            WHEN (sum(v.total_flow_rate_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_flow_rate_last))::numeric / (sum(v.total_flow_rate_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_flow_rate_available_percent,
    bool_or(v.power_is_visible) AS power_is_visible,
    (sum(v.total_power_max))::numeric AS total_power_max,
    (sum(v.total_power_last))::numeric AS total_power_last,
    MAX(v.power_unit) AS power_unit,
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric)
        END AS pct_power_available_fraction,
    (
        CASE
            WHEN (sum(v.total_power_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_power_last))::numeric / (sum(v.total_power_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_power_available_percent,
    bool_or(v.pressure_is_visible) AS pressure_is_visible,
    (sum(v.total_pressure_max))::numeric AS total_pressure_max,
    (sum(v.total_pressure_last))::numeric AS total_pressure_last,
    MAX(v.pressure_unit) AS pressure_unit,
        CASE
            WHEN (sum(v.total_pressure_max) = (0)::double precision) THEN NULL::numeric
            ELSE ((sum(v.total_pressure_last))::numeric / (sum(v.total_pressure_max))::numeric)
        END AS pct_pressure_available_fraction,
    (
        CASE
            WHEN (sum(v.total_pressure_max) = (0)::double precision) THEN NULL::numeric
            ELSE (((sum(v.total_pressure_last))::numeric / (sum(v.total_pressure_max))::numeric) * (100)::numeric)
        END)::numeric(6,2) AS pct_pressure_available_percent,
    ((sum(v.total_last_asset_available_rate))::numeric / (NULLIF(count(*), 0))::numeric) AS avg_last_asset_available_rate,
    count(*) AS total_units
   FROM ( SELECT uat.unit_id,
            uat.unit_code,
            uat.system_parent_id,
            uat.asset_tag_id,
            uat.tag_description AS asset_tag_description,
            bool_or(uat.flow_rate_is_visible) AS flow_rate_is_visible,
            COALESCE(sum(uat.flow_rate_max), (0)::double precision) AS total_flow_rate_max,
            COALESCE(sum(uat.last_flow_rate), (0)::double precision) AS total_flow_rate_last,
            MAX(uat.flow_rate_unit) AS flow_rate_unit,
            bool_or(uat.power_is_visible) AS power_is_visible,
            COALESCE(sum(uat.power_max), (0)::double precision) AS total_power_max,
            COALESCE(sum(uat.last_power), (0)::double precision) AS total_power_last,
            MAX(uat.power_unit) AS power_unit,
            bool_or(uat.pressure_is_visible) AS pressure_is_visible,
            COALESCE(sum(uat.pressure_max), (0)::double precision) AS total_pressure_max,
            COALESCE(sum(uat.last_pressure), (0)::double precision) AS total_pressure_last,
            MAX(uat.pressure_unit) AS pressure_unit,
            COALESCE(sum(uat.last_asset_available_rate), (0)::double precision) AS total_last_asset_available_rate
           FROM public.v_units_assets_tags uat
          WHERE (uat.is_deleted = false)
          GROUP BY uat.unit_id, uat.unit_code, uat.system_parent_id, uat.asset_tag_id, uat.tag_description) v
  GROUP BY v.system_parent_id, v.asset_tag_id, v.asset_tag_description
  ORDER BY v.system_parent_id, v.asset_tag_description;

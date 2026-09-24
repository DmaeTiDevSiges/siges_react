SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET transaction_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;

SELECT pg_catalog.set_config('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER FUNCTION public.change_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cfg_activities; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_activities OWNER TO supabase_admin;

--
-- Name: fc_activities_search(text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_activities_search(srch_terms text) OWNER TO supabase_admin;

--
-- Name: fc_api_key_validate(text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_api_key_validate(p_api_key text) OWNER TO supabase_admin;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets OWNER TO supabase_admin;

--
-- Name: fc_assets_search_filters(integer[], integer[], integer[], integer[], integer[], text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) OWNER TO supabase_admin;

--
-- Name: fc_assets_search_type(text, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) OWNER TO supabase_admin;

--
-- Name: fc_assets_search_unit(text, integer, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_assets_searchable(text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_assets_searchable_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_assets_searchable_update() OWNER TO supabase_admin;

--
-- Name: fc_cfg_units_assets_tags_set_last_values_when_processing_2(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() OWNER TO supabase_admin;

--
-- Name: fc_check_user_permission(bigint, character varying, character varying); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) OWNER TO supabase_admin;

--
-- Name: cfg_services; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_contracts_services OWNER TO supabase_admin;

--
-- Name: fc_contracts_services_search(text, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) OWNER TO supabase_admin;

--
-- Name: cfg_orders_causes_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_extras OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_extras_filters(timestamp without time zone, timestamp without time zone, integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) OWNER TO supabase_admin;

--
-- Name: v_orders_visits_extras_no_archived; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_extras_no_archived OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_extras_no_archived_filters(integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) OWNER TO supabase_admin;

--
-- Name: cfg_orders_cancel_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders OWNER TO supabase_admin;

--
-- Name: v_dash_admin_orders_filters_open; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_dash_admin_orders_filters_open OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_filters_open(integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], integer[], text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) OWNER TO supabase_admin;

--
-- Name: v_dash_admin_orders_parent_filters_open; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_dash_admin_orders_parent_filters_open OWNER TO supabase_admin;

--
-- Name: fc_dash_admin_orders_parent_filters_open(integer[], integer[], integer[], integer[], integer[], integer[], integer[], text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_dashboard_stats(bigint, bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_durations_hours_decimals(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_durations_hours_decimals() OWNER TO supabase_admin;

--
-- Name: fc_financial_orders_visits_materials_sum(integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) OWNER TO supabase_admin;

--
-- Name: fc_financial_orders_visits_services_sum(integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) OWNER TO supabase_admin;

--
-- Name: fc_financial_orders_visits_vehicles_sum(integer[]); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) OWNER TO supabase_admin;

--
-- Name: fc_get_profile_permissions(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_get_user_permissions(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_get_user_permissions(p_user_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_imgproxy_sign_url(text, text, text, text, text, boolean); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) OWNER TO supabase_admin;

--
-- Name: fc_import_orders_visits_contracts_update_finger_print(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() OWNER TO supabase_admin;

--
-- Name: fc_leader_tracker_interval(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_leader_tracker_interval() OWNER TO supabase_admin;

--
-- Name: FUNCTION fc_leader_tracker_interval(); Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_materials_searchable() OWNER TO supabase_admin;

--
-- Name: fc_order_counter_increment(bigint, integer, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) OWNER TO supabase_admin;

--
-- Name: fc_order_status_inheritance(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_order_status_inheritance() OWNER TO supabase_admin;

--
-- Name: FUNCTION fc_order_status_inheritance(); Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_op_counter_trigger() OWNER TO supabase_admin;

--
-- Name: fc_orders_replace_special_chars(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_replace_special_chars() OWNER TO supabase_admin;

--
-- Name: cfg_orders_types_activities; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_types_activities OWNER TO supabase_admin;

--
-- Name: fc_orders_types_activities_search(text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_activities_description(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_assets_activities_description() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_materials_update_value_total(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_assets_materials_update_value_total() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_activities_searchable(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_assets_update_activities_searchable() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_materials_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_assets_update_materials_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_services_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_assets_update_services_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_assets_update_vehicles_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_assets_update_vehicles_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_extras_teams_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_extras_teams_update() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_services_amount_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_services_amount_update() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_services_update_services_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_services_update_services_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_services_update_value_unit(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_services_update_value_unit() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_teams_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_teams_update() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_update_total_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_update_total_value() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_vehicles_before_save(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_vehicles_before_save() OWNER TO supabase_admin;

--
-- Name: fc_orders_visits_vehicles_update_vehicles_value(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() OWNER TO supabase_admin;

--
-- Name: fc_regenerate_asset_description(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_set_ov_started_date_parts(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_set_ov_started_date_parts() OWNER TO supabase_admin;

--
-- Name: fc_sync_ov_costs_status(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_sync_ov_costs_status() OWNER TO supabase_admin;

--
-- Name: fc_system_parent_id_10_at_id_33_46_uata_rate(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() OWNER TO supabase_admin;

--
-- Name: fc_team_descendants(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_team_descendants(team_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_tgr_units_searchable(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_tgr_units_searchable() OWNER TO supabase_admin;

--
-- Name: technicals_manuals; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_technicals_manuals OWNER TO supabase_admin;

--
-- Name: fc_tm_assets_types_search_terms(text, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) OWNER TO supabase_admin;

--
-- Name: fc_total_value_update(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_total_value_update() OWNER TO supabase_admin;

--
-- Name: fc_unit_05_assets_tags_available_rate(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_unit_05_assets_tags_available_rate() OWNER TO supabase_admin;

--
-- Name: cfg_units_assets_tags; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_by_assets_tags OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_available_rate_search_filters(integer, integer[], integer[], integer[], integer[], integer, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) OWNER TO supabase_admin;

--
-- Name: cfg_assets_available_processing; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_assets_tags OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_search_filters(integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_update_asset_tag_description(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_assets_tags_update_asset_tag_description() OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_update_asset_tag_sub_description(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() OWNER TO supabase_admin;

--
-- Name: fc_units_assets_tags_update_op_counter(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_assets_tags_update_op_counter() OWNER TO supabase_admin;

--
-- Name: cfg_units_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units OWNER TO supabase_admin;

--
-- Name: fc_units_search(character varying, character varying); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) OWNER TO supabase_admin;

--
-- Name: fc_units_search_filters(integer[], integer[], integer[], integer[], integer, text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) OWNER TO supabase_admin;

--
-- Name: fc_units_search_filters(integer[], integer[], integer[], integer[], integer, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) OWNER TO supabase_admin;

--
-- Name: fc_update_after_img_file_name(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_update_after_img_file_name() OWNER TO supabase_admin;

--
-- Name: fc_update_after_img_files_names(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_update_after_img_files_names() OWNER TO supabase_admin;

--
-- Name: fc_update_before_img_file_name(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_update_before_img_file_name() OWNER TO supabase_admin;

--
-- Name: fc_update_before_img_files_names(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_update_before_img_files_names() OWNER TO supabase_admin;

--
-- Name: fc_update_op_counter(bigint); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) OWNER TO supabase_admin;

--
-- Name: fc_update_profile_routes(bigint, jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) OWNER TO supabase_admin;

--
-- Name: flow_order_visit_close_v2(jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.flow_order_visit_close_v2(payload jsonb) OWNER TO supabase_admin;

--
-- Name: flow_order_visit_create_v2(jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.flow_order_visit_create_v2(payload jsonb) OWNER TO supabase_admin;

--
-- Name: fn_audit_visit_costs_status(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.fn_audit_visit_costs_status() OWNER TO supabase_admin;

--
-- Name: generate_impersonation_link(bigint, text, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) OWNER TO supabase_admin;

--
-- Name: get_users_within_distance(double precision, double precision, double precision, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) OWNER TO supabase_admin;

--
-- Name: handle_followers_orders_status_changed(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.handle_followers_orders_status_changed() OWNER TO supabase_admin;

--
-- Name: FUNCTION handle_followers_orders_status_changed(); Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.handle_new_user() OWNER TO supabase_admin;

--
-- Name: handle_notifications_count(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.handle_notifications_count() OWNER TO supabase_admin;

--
-- Name: handle_profile_photo_change_notification(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.handle_profile_photo_change_notification() OWNER TO supabase_admin;

--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.handle_updated_at() OWNER TO supabase_admin;

--
-- Name: match_documents(extensions.vector, integer, jsonb); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) OWNER TO supabase_admin;

--
-- Name: match_knowledge(extensions.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) OWNER TO supabase_admin;

--
-- Name: nearby_units(double precision, double precision, double precision, text); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) OWNER TO supabase_admin;

--
-- Name: recalculate_all_scores(integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) OWNER TO supabase_admin;

--
-- Name: recalculate_department_scores(bigint, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) OWNER TO supabase_admin;

--
-- Name: recalculate_leader_monthly_score(bigint, integer, integer); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) OWNER TO supabase_admin;

--
-- Name: restore_original_password(uuid); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.restore_original_password(p_user_uuid uuid) OWNER TO supabase_admin;

--
-- Name: update_cfg_app_notices_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.update_cfg_app_notices_updated_at() OWNER TO supabase_admin;

--
-- Name: update_cfg_app_tips_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.update_cfg_app_tips_updated_at() OWNER TO supabase_admin;

--
-- Name: update_system_notices_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.update_system_notices_updated_at() OWNER TO supabase_admin;

--
-- Name: update_unit_asset_tag_availability(integer, boolean, integer, text, integer, text, text, integer, integer, integer, numeric, text, text, double precision, double precision, double precision, double precision, double precision, integer, boolean); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

ALTER FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) OWNER TO supabase_admin;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE public.ai_chat_histories_id_seq OWNER TO supabase_admin;

--
-- Name: ai_chat_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.ai_chat_histories_id_seq OWNED BY public.ai_chat_histories.id;


--
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_checklists_id_seq OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_checklists_id_seq OWNED BY public.assets_loans_checklists.id;


--
-- Name: assets_loans_checklists_images; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_checklists_images_id_seq OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_checklists_images_id_seq OWNED BY public.assets_loans_checklists_images.id;


--
-- Name: assets_loans_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_id_seq OWNER TO supabase_admin;

--
-- Name: assets_loans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.assets_loans_id_seq OWNED BY public.assets_loans.id;


--
-- Name: assets_materials; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_companies_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_companies_id_seq OWNED BY public.cfg_app_tips_companies.id;


--
-- Name: cfg_app_tips_departments; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_departments_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_departments_id_seq OWNED BY public.cfg_app_tips_departments.id;


--
-- Name: cfg_app_tips_dismissals; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_dismissals_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_dismissals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_dismissals_id_seq OWNED BY public.cfg_app_tips_dismissals.id;


--
-- Name: cfg_app_tips_new_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_new_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_new_id_seq OWNED BY public.cfg_app_tips.id;


--
-- Name: cfg_app_tips_profiles; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_profiles_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_app_tips_profiles_id_seq OWNED BY public.cfg_app_tips_profiles.id;


--
-- Name: cfg_app_versions_update; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_assets_attributes_groups_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_assets_attributes_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_assets_attributes_groups_id_seq OWNED BY public.cfg_assets_attributes_groups.id;


--
-- Name: cfg_assets_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_assets_types_loans_checklists_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_assets_types_loans_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_assets_types_loans_checklists_id_seq OWNED BY public.cfg_assets_types_loans_checklists.id;


--
-- Name: cfg_assets_unavailable_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_loans_checklists_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_loans_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_loans_checklists_id_seq OWNED BY public.cfg_loans_checklists.id;


--
-- Name: cfg_materials_purchases_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_material_purchases_statuses_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_material_purchases_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_material_purchases_statuses_id_seq OWNED BY public.cfg_materials_purchases_statuses.id;


--
-- Name: cfg_materials_purchases_cancel_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_materials_purchases_types_id_seq OWNER TO supabase_admin;

--
-- Name: cfg_materials_purchases_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.cfg_materials_purchases_types_id_seq OWNED BY public.cfg_materials_purchases_types.id;


--
-- Name: cfg_materials_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.documents_id_seq OWNER TO supabase_admin;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: extensions; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.impersonation_password_backup_id_seq OWNER TO supabase_admin;

--
-- Name: impersonation_password_backup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.impersonation_password_backup_id_seq OWNED BY public.impersonation_password_backup.id;


--
-- Name: import_orders_visits_contracts; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_id_seq OWNER TO supabase_admin;

--
-- Name: maintenances_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_id_seq OWNED BY public.maintenances_plans.id;


--
-- Name: maintenances_plans_sections; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_sections_activities_id_seq OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_sections_activities_id_seq OWNED BY public.maintenances_plans_sections_activities.id;


--
-- Name: maintenances_plans_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_sections_id_seq OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.maintenances_plans_sections_id_seq OWNED BY public.maintenances_plans_sections.id;


--
-- Name: materials_purchases; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.material_purchases_id_seq OWNER TO supabase_admin;

--
-- Name: material_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.material_purchases_id_seq OWNED BY public.materials_purchases.id;


--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.n8n_chat_histories_id_seq OWNER TO supabase_admin;

--
-- Name: n8n_chat_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.n8n_chat_histories_id_seq OWNED BY public.n8n_chat_histories.id;


--
-- Name: orders_followers; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_id_seq OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_id_seq OWNED BY public.orders_visits_chat.id;


--
-- Name: orders_visits_chat_participants; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_participants_id_seq OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_participants_id_seq OWNED BY public.orders_visits_chat_participants.id;


--
-- Name: orders_visits_chat_reads; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_reads_id_seq OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.orders_visits_chat_reads_id_seq OWNED BY public.orders_visits_chat_reads.id;


--
-- Name: orders_visits_evaluations; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notice_categories_id_seq OWNER TO supabase_admin;

--
-- Name: system_notice_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notice_categories_id_seq OWNED BY public.cfg_app_notices_categories.id;


--
-- Name: system_notice_severities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notice_severities_id_seq OWNER TO supabase_admin;

--
-- Name: system_notice_severities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notice_severities_id_seq OWNED BY public.cfg_app_notices_severities.id;


--
-- Name: system_notices_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notices_id_seq OWNER TO supabase_admin;

--
-- Name: system_notices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.system_notices_id_seq OWNED BY public.cfg_app_notices.id;


--
-- Name: technicals_manuals_assets; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.technicals_manuals_files_id_seq OWNER TO supabase_admin;

--
-- Name: technicals_manuals_files; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.tools_id_seq OWNER TO supabase_admin;

--
-- Name: tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.tools_id_seq OWNED BY public.tools.id;


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.users_tools_id_seq OWNER TO supabase_admin;

--
-- Name: users_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.users_tools_id_seq OWNED BY public.users_tools.id;


--
-- Name: users_tools_movements; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.users_tools_movements_id_seq OWNER TO supabase_admin;

--
-- Name: users_tools_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.users_tools_movements_id_seq OWNED BY public.users_tools_movements.id;


--
-- Name: users_tracker; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_app OWNER TO supabase_admin;

--
-- Name: v_app_notices; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_app_notices OWNER TO supabase_admin;

--
-- Name: v_app_offline_updates; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_app_offline_updates OWNER TO supabase_admin;

--
-- Name: v_app_pages; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_app_pages OWNER TO supabase_admin;

--
-- Name: v_assets_available; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_available OWNER TO supabase_admin;

--
-- Name: v_assets_couplings_models; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_couplings_models OWNER TO supabase_admin;

--
-- Name: v_assets_followers; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_followers OWNER TO supabase_admin;

--
-- Name: v_assets_loans; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_loans OWNER TO supabase_admin;

--
-- Name: v_assets_materials; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_materials OWNER TO supabase_admin;

--
-- Name: v_assets_priorities; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_priorities OWNER TO supabase_admin;

--
-- Name: v_assets_statuses; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_statuses OWNER TO supabase_admin;

--
-- Name: v_assets_tags; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_tags OWNER TO supabase_admin;

--
-- Name: v_assets_tags_subs; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_tags_subs OWNER TO supabase_admin;

--
-- Name: v_assets_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_types OWNER TO supabase_admin;

--
-- Name: v_assets_unavailable_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_assets_unavailable_reasons OWNER TO supabase_admin;

--
-- Name: v_companies; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_companies OWNER TO supabase_admin;

--
-- Name: v_contracts; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_contracts OWNER TO supabase_admin;

--
-- Name: v_contracts_evaluation_requirements; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_contracts_evaluation_requirements OWNER TO supabase_admin;

--
-- Name: v_contracts_managers; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_contracts_managers OWNER TO supabase_admin;

--
-- Name: v_dash_admin_orders_parent_status_1; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_dash_admin_orders_parent_status_1 OWNER TO supabase_admin;

--
-- Name: v_departments; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_departments OWNER TO supabase_admin;

--
-- Name: v_import_orders_visits_contracts; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_import_orders_visits_contracts OWNER TO supabase_admin;

--
-- Name: v_leader_ranking; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_leader_ranking OWNER TO supabase_admin;

--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_materials OWNER TO supabase_admin;

--
-- Name: VIEW v_materials; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_materials_purchases OWNER TO supabase_admin;

--
-- Name: v_order_visit_scores; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_order_visit_scores OWNER TO supabase_admin;

--
-- Name: v_orders_cancel_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_cancel_reasons OWNER TO supabase_admin;

--
-- Name: v_orders_causes_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_causes_reasons OWNER TO supabase_admin;

--
-- Name: v_orders_counter; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_counter OWNER TO supabase_admin;

--
-- Name: v_orders_followers; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_followers OWNER TO supabase_admin;

--
-- Name: v_orders_objects; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_objects OWNER TO supabase_admin;

--
-- Name: v_orders_open; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_open OWNER TO supabase_admin;

--
-- Name: v_orders_parent; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_parent OWNER TO supabase_admin;

--
-- Name: v_orders_plans; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_plans OWNER TO supabase_admin;

--
-- Name: v_orders_priorities; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_priorities OWNER TO supabase_admin;

--
-- Name: v_orders_statuses; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_statuses OWNER TO supabase_admin;

--
-- Name: v_orders_suspended_reasons; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_suspended_reasons OWNER TO supabase_admin;

--
-- Name: v_orders_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_types OWNER TO supabase_admin;

--
-- Name: v_orders_types_subs; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_types_subs OWNER TO supabase_admin;

--
-- Name: v_orders_visits; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits OWNER TO supabase_admin;

--
-- Name: v_orders_visits_assets; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_assets OWNER TO supabase_admin;

--
-- Name: v_orders_visits_assets_activities; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_assets_activities OWNER TO supabase_admin;

--
-- Name: v_orders_visits_assets_materials; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_assets_materials OWNER TO supabase_admin;

--
-- Name: v_orders_visits_evaluations; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_evaluations OWNER TO supabase_admin;

--
-- Name: v_orders_visits_extras_followers; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_extras_followers OWNER TO supabase_admin;

--
-- Name: v_orders_visits_extras_teams; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_extras_teams OWNER TO supabase_admin;

--
-- Name: v_orders_visits_services; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_services OWNER TO supabase_admin;

--
-- Name: v_orders_visits_teams; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_teams OWNER TO supabase_admin;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_orders_visits_vehicles OWNER TO supabase_admin;

--
-- Name: v_profiles; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_profiles OWNER TO supabase_admin;

--
-- Name: v_profiles_permissions; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_profiles_permissions OWNER TO supabase_admin;

--
-- Name: v_services; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_services OWNER TO supabase_admin;

--
-- Name: v_systems; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_systems OWNER TO supabase_admin;

--
-- Name: v_systems_parent; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_systems_parent OWNER TO supabase_admin;

--
-- Name: v_systems_parent_assets_tags_available_rate; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_systems_parent_assets_tags_available_rate OWNER TO supabase_admin;

--
-- Name: v_systems_parent_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_systems_parent_assets_tags_processing_counts OWNER TO supabase_admin;

--
-- Name: v_teams; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_teams OWNER TO supabase_admin;

--
-- Name: v_users; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_users OWNER TO supabase_admin;

--
-- Name: v_teams_leaders; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_teams_leaders OWNER TO supabase_admin;

--
-- Name: v_technicals_manuals_assets; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_technicals_manuals_assets OWNER TO supabase_admin;

--
-- Name: v_technicals_manuals_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_technicals_manuals_types OWNER TO supabase_admin;

--
-- Name: v_unit_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_unit_assets_tags_processing_counts OWNER TO supabase_admin;

--
-- Name: v_units_asset_available_rate_avg; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_asset_available_rate_avg OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_availability; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_assets_tags_availability OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_available_rate; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_assets_tags_available_rate OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_available_rate_latest_by_user; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_assets_tags_available_rate_latest_by_user OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags_processing_counts; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_assets_tags_processing_counts OWNER TO supabase_admin;

--
-- Name: v_units_statuses; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_statuses OWNER TO supabase_admin;

--
-- Name: v_units_types; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_types OWNER TO supabase_admin;

--
-- Name: v_units_types_parent; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_units_types_parent OWNER TO supabase_admin;

--
-- Name: v_users_notifications; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_users_notifications OWNER TO supabase_admin;

--
-- Name: v_users_permissions; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_users_permissions OWNER TO supabase_admin;

--
-- Name: VIEW v_users_permissions; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER VIEW public.v_vehicles OWNER TO supabase_admin;

--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.warehouses_materials_id_seq OWNER TO supabase_admin;

--
-- Name: warehouses_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase_admin
--

ALTER SEQUENCE public.warehouses_materials_id_seq OWNED BY public.warehouses_materials.id;


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON SEQUENCES  TO "databasus-e163795d";

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON SEQUENCES  TO "databasus-93da8106";

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON SEQUENCES  TO "databasus-3a3c9dfb";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON TABLES  TO "databasus-e163795d";

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON TABLES  TO "databasus-93da8106";

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT ON TABLES  TO "databasus-3a3c9dfb";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict hbbn9Jn0bLLAQPlBRHq6u2awjeOCfntRrRkfGgtSEFpDGFRnoJ6mbKLNYnsQAY0

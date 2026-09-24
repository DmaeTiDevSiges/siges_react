GRANT USAGE ON SCHEMA auth TO anon;

GRANT USAGE ON SCHEMA auth TO authenticated;

GRANT USAGE ON SCHEMA auth TO service_role;

GRANT ALL ON SCHEMA auth TO supabase_auth_admin;

GRANT ALL ON SCHEMA auth TO dashboard_user;

GRANT ALL ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;

GRANT USAGE ON SCHEMA public TO anon;

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT USAGE ON SCHEMA public TO service_role;

GRANT USAGE ON SCHEMA public TO "databasus-e163795d";

GRANT USAGE ON SCHEMA public TO "databasus-93da8106";

GRANT USAGE ON SCHEMA public TO "databasus-3a3c9dfb";


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA storage TO postgres;

GRANT USAGE ON SCHEMA storage TO anon;

GRANT USAGE ON SCHEMA storage TO authenticated;

GRANT USAGE ON SCHEMA storage TO service_role;

GRANT ALL ON SCHEMA storage TO supabase_storage_admin;

GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;

GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION change_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.change_updated_at() TO anon;

GRANT ALL ON FUNCTION public.change_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.change_updated_at() TO service_role;


--
-- Name: TABLE cfg_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_activities TO postgres;

GRANT ALL ON TABLE public.cfg_activities TO anon;

GRANT ALL ON TABLE public.cfg_activities TO authenticated;

GRANT ALL ON TABLE public.cfg_activities TO service_role;

GRANT SELECT ON TABLE public.cfg_activities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_activities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_activities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_activities TO postgres;

GRANT ALL ON TABLE public.v_activities TO anon;

GRANT ALL ON TABLE public.v_activities TO authenticated;

GRANT ALL ON TABLE public.v_activities TO service_role;

GRANT SELECT ON TABLE public.v_activities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_activities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_activities TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_activities_search(srch_terms text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO postgres;

GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO anon;

GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_activities_search(srch_terms text) TO service_role;


--
-- Name: FUNCTION fc_api_key_validate(p_api_key text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO postgres;

GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO anon;

GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_api_key_validate(p_api_key text) TO service_role;


--
-- Name: TABLE assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets TO postgres;

GRANT ALL ON TABLE public.assets TO anon;

GRANT ALL ON TABLE public.assets TO authenticated;

GRANT ALL ON TABLE public.assets TO service_role;

GRANT SELECT ON TABLE public.assets TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_couplings_models; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_couplings_models TO postgres;

GRANT ALL ON TABLE public.cfg_assets_couplings_models TO anon;

GRANT ALL ON TABLE public.cfg_assets_couplings_models TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_couplings_models TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_couplings_models TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_couplings_models TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_couplings_models TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_priorities TO postgres;

GRANT ALL ON TABLE public.cfg_assets_priorities TO anon;

GRANT ALL ON TABLE public.cfg_assets_priorities TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_priorities TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_priorities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_priorities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_assets_statuses TO anon;

GRANT ALL ON TABLE public.cfg_assets_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_tags TO postgres;

GRANT ALL ON TABLE public.cfg_assets_tags TO anon;

GRANT ALL ON TABLE public.cfg_assets_tags TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_tags TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_tags TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_tags TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_tags_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_tags_subs TO postgres;

GRANT ALL ON TABLE public.cfg_assets_tags_subs TO anon;

GRANT ALL ON TABLE public.cfg_assets_tags_subs TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_tags_subs TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_tags_subs TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_tags_subs TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_tags_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_types TO postgres;

GRANT ALL ON TABLE public.cfg_assets_types TO anon;

GRANT ALL ON TABLE public.cfg_assets_types TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_types TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_companies; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_companies TO postgres;

GRANT ALL ON TABLE public.cfg_companies TO anon;

GRANT ALL ON TABLE public.cfg_companies TO authenticated;

GRANT ALL ON TABLE public.cfg_companies TO service_role;

GRANT SELECT ON TABLE public.cfg_companies TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_companies TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_companies TO "databasus-3a3c9dfb";


--
-- Name: TABLE clients; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.clients TO postgres;

GRANT ALL ON TABLE public.clients TO anon;

GRANT ALL ON TABLE public.clients TO authenticated;

GRANT ALL ON TABLE public.clients TO service_role;

GRANT SELECT ON TABLE public.clients TO "databasus-e163795d";

GRANT SELECT ON TABLE public.clients TO "databasus-93da8106";

GRANT SELECT ON TABLE public.clients TO "databasus-3a3c9dfb";


--
-- Name: TABLE materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.materials TO postgres;

GRANT ALL ON TABLE public.materials TO anon;

GRANT ALL ON TABLE public.materials TO authenticated;

GRANT ALL ON TABLE public.materials TO service_role;

GRANT SELECT ON TABLE public.materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE units; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.units TO postgres;

GRANT ALL ON TABLE public.units TO anon;

GRANT ALL ON TABLE public.units TO authenticated;

GRANT ALL ON TABLE public.units TO service_role;

GRANT SELECT ON TABLE public.units TO "databasus-e163795d";

GRANT SELECT ON TABLE public.units TO "databasus-93da8106";

GRANT SELECT ON TABLE public.units TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets TO postgres;

GRANT ALL ON TABLE public.v_assets TO anon;

GRANT ALL ON TABLE public.v_assets TO authenticated;

GRANT ALL ON TABLE public.v_assets TO service_role;

GRANT SELECT ON TABLE public.v_assets TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO postgres;

GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO anon;

GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO authenticated;

GRANT ALL ON FUNCTION public.fc_assets_search_filters(units_ids integer[], statuses_ids integer[], tags_ids integer[], tags_subs_ids integer[], types_ids integer[], search_terms text, app_version_mode text, limit_value integer, offset_value integer) TO service_role;


--
-- Name: FUNCTION fc_assets_search_type(search_terms text, asset_type_id integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO postgres;

GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO anon;

GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO authenticated;

GRANT ALL ON FUNCTION public.fc_assets_search_type(search_terms text, asset_type_id integer) TO service_role;


--
-- Name: FUNCTION fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO postgres;

GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO anon;

GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_assets_search_unit(search_terms text, unit_id integer, app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_assets_searchable(search_terms text, app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO postgres;

GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO anon;

GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_assets_searchable(search_terms text, app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_assets_searchable_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO postgres;

GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO anon;

GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO authenticated;

GRANT ALL ON FUNCTION public.fc_assets_searchable_update() TO service_role;


--
-- Name: FUNCTION fc_cfg_units_assets_tags_set_last_values_when_processing_2(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO postgres;

GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO anon;

GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO authenticated;

GRANT ALL ON FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2() TO service_role;


--
-- Name: FUNCTION fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO postgres;

GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO anon;

GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO authenticated;

GRANT ALL ON FUNCTION public.fc_check_user_permission(p_user_id bigint, p_route_key character varying, p_action character varying) TO service_role;


--
-- Name: TABLE cfg_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_services TO postgres;

GRANT ALL ON TABLE public.cfg_services TO anon;

GRANT ALL ON TABLE public.cfg_services TO authenticated;

GRANT ALL ON TABLE public.cfg_services TO service_role;

GRANT SELECT ON TABLE public.cfg_services TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_services TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts_services TO postgres;

GRANT ALL ON TABLE public.contracts_services TO anon;

GRANT ALL ON TABLE public.contracts_services TO authenticated;

GRANT ALL ON TABLE public.contracts_services TO service_role;

GRANT SELECT ON TABLE public.contracts_services TO "databasus-e163795d";

GRANT SELECT ON TABLE public.contracts_services TO "databasus-93da8106";

GRANT SELECT ON TABLE public.contracts_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts_services TO postgres;

GRANT ALL ON TABLE public.v_contracts_services TO anon;

GRANT ALL ON TABLE public.v_contracts_services TO authenticated;

GRANT ALL ON TABLE public.v_contracts_services TO service_role;

GRANT SELECT ON TABLE public.v_contracts_services TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_contracts_services TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_contracts_services TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_contracts_services_search(search_terms text, contract_id_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO postgres;

GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO anon;

GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO authenticated;

GRANT ALL ON FUNCTION public.fc_contracts_services_search(search_terms text, contract_id_value integer) TO service_role;


--
-- Name: TABLE cfg_orders_causes_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO postgres;

GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO anon;

GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_causes_reasons TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_causes_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_causes_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_causes_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_priorities TO postgres;

GRANT ALL ON TABLE public.cfg_orders_priorities TO anon;

GRANT ALL ON TABLE public.cfg_orders_priorities TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_priorities TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_priorities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_priorities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_types TO postgres;

GRANT ALL ON TABLE public.cfg_orders_types TO anon;

GRANT ALL ON TABLE public.cfg_orders_types TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_types TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_types_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_types_subs TO postgres;

GRANT ALL ON TABLE public.cfg_orders_types_subs TO anon;

GRANT ALL ON TABLE public.cfg_orders_types_subs TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_types_subs TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_types_subs TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_types_subs TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_types_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_visits_extras_processing; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO postgres;

GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO anon;

GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_visits_extras_processing TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_visits_extras_processing TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_visits_extras_processing TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_visits_extras_processing TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_systems; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_systems TO postgres;

GRANT ALL ON TABLE public.cfg_systems TO anon;

GRANT ALL ON TABLE public.cfg_systems TO authenticated;

GRANT ALL ON TABLE public.cfg_systems TO service_role;

GRANT SELECT ON TABLE public.cfg_systems TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_systems TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_systems TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_teams TO postgres;

GRANT ALL ON TABLE public.cfg_teams TO anon;

GRANT ALL ON TABLE public.cfg_teams TO authenticated;

GRANT ALL ON TABLE public.cfg_teams TO service_role;

GRANT SELECT ON TABLE public.cfg_teams TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_teams TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_units_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_units_types TO postgres;

GRANT ALL ON TABLE public.cfg_units_types TO anon;

GRANT ALL ON TABLE public.cfg_units_types TO authenticated;

GRANT ALL ON TABLE public.cfg_units_types TO service_role;

GRANT SELECT ON TABLE public.cfg_units_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_units_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_units_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_extras; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_extras TO postgres;

GRANT ALL ON TABLE public.orders_visits_extras TO anon;

GRANT ALL ON TABLE public.orders_visits_extras TO authenticated;

GRANT ALL ON TABLE public.orders_visits_extras TO service_role;

GRANT SELECT ON TABLE public.orders_visits_extras TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_extras TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_extras TO "databasus-3a3c9dfb";


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users TO postgres;

GRANT ALL ON TABLE public.users TO anon;

GRANT ALL ON TABLE public.users TO authenticated;

GRANT ALL ON TABLE public.users TO service_role;

GRANT SELECT ON TABLE public.users TO "databasus-e163795d";

GRANT SELECT ON TABLE public.users TO "databasus-93da8106";

GRANT SELECT ON TABLE public.users TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_extras; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_extras TO anon;

GRANT ALL ON TABLE public.v_orders_visits_extras TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_extras TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_extras TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_extras TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_extras TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO postgres;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO anon;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO authenticated;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_filters(date_start timestamp without time zone, date_end timestamp without time zone, o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO service_role;


--
-- Name: TABLE v_orders_visits_extras_no_archived; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO anon;

GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_extras_no_archived TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_extras_no_archived TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_extras_no_archived TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_extras_no_archived TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO postgres;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO anon;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO authenticated;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_extras_no_archived_filters(o_types_ids integer[], teams_ids integer[], units_ids integer[], assets_tags_ids integer[], o_types_subs_ids integer[], systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], o_causes_reasons_ids integer[]) TO service_role;


--
-- Name: TABLE cfg_orders_cancel_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO postgres;

GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO anon;

GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_cancel_reasons TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_cancel_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_cancel_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_cancel_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_objects; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_objects TO postgres;

GRANT ALL ON TABLE public.cfg_orders_objects TO anon;

GRANT ALL ON TABLE public.cfg_orders_objects TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_objects TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_objects TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_objects TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_objects TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_plans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_plans TO postgres;

GRANT ALL ON TABLE public.cfg_orders_plans TO anon;

GRANT ALL ON TABLE public.cfg_orders_plans TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_plans TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_plans TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_plans TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_plans TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_orders_statuses TO anon;

GRANT ALL ON TABLE public.cfg_orders_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_suspended_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO postgres;

GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO anon;

GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_suspended_reasons TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_suspended_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_suspended_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_suspended_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts TO postgres;

GRANT ALL ON TABLE public.contracts TO anon;

GRANT ALL ON TABLE public.contracts TO authenticated;

GRANT ALL ON TABLE public.contracts TO service_role;

GRANT SELECT ON TABLE public.contracts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.contracts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders TO postgres;

GRANT ALL ON TABLE public.orders TO anon;

GRANT ALL ON TABLE public.orders TO authenticated;

GRANT ALL ON TABLE public.orders TO service_role;

GRANT SELECT ON TABLE public.orders TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders TO postgres;

GRANT ALL ON TABLE public.v_orders TO anon;

GRANT ALL ON TABLE public.v_orders TO authenticated;

GRANT ALL ON TABLE public.v_orders TO service_role;

GRANT SELECT ON TABLE public.v_orders TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_dash_admin_orders_filters_open; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO postgres;

GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO anon;

GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO authenticated;

GRANT ALL ON TABLE public.v_dash_admin_orders_filters_open TO service_role;

GRANT SELECT ON TABLE public.v_dash_admin_orders_filters_open TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_dash_admin_orders_filters_open TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_dash_admin_orders_filters_open TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO postgres;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO anon;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_ids integer[], assets_tags_ids integer[], orders_types_ids integer[], orders_types_subs_ids integer[], contracts_ids integer[], companies_ids integer[], orders_objects_ids integer[], orders_plans_ids integer[], teams_ids integer[], app_version_mode text) TO service_role;


--
-- Name: TABLE v_dash_admin_orders_parent_filters_open; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO postgres;

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO anon;

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO authenticated;

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_filters_open TO service_role;

GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_filters_open TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_filters_open TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_filters_open TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO postgres;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO anon;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_dash_admin_orders_parent_filters_open(systems_parents_ids integer[], systems_ids integer[], units_types_parents_ids integer[], units_types_ids integer[], units_ids integer[], orders_types_ids integer[], assets_tags_ids integer[], app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_dashboard_stats(p_company_id bigint, p_team_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO postgres;

GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO anon;

GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO authenticated;

GRANT ALL ON FUNCTION public.fc_dashboard_stats(p_company_id bigint, p_team_id bigint) TO service_role;


--
-- Name: FUNCTION fc_durations_hours_decimals(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO postgres;

GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO anon;

GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO authenticated;

GRANT ALL ON FUNCTION public.fc_durations_hours_decimals() TO service_role;


--
-- Name: FUNCTION fc_financial_orders_visits_materials_sum(ov_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO postgres;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO anon;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO authenticated;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_materials_sum(ov_ids integer[]) TO service_role;


--
-- Name: FUNCTION fc_financial_orders_visits_services_sum(ov_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO postgres;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO anon;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO authenticated;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_services_sum(ov_ids integer[]) TO service_role;


--
-- Name: FUNCTION fc_financial_orders_visits_vehicles_sum(ov_ids integer[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO postgres;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO anon;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO authenticated;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[]) TO service_role;


--
-- Name: FUNCTION fc_get_profile_permissions(p_profile_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO postgres;

GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO anon;

GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO authenticated;

GRANT ALL ON FUNCTION public.fc_get_profile_permissions(p_profile_id bigint) TO service_role;


--
-- Name: FUNCTION fc_get_user_permissions(p_user_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO postgres;

GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO anon;

GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO authenticated;

GRANT ALL ON FUNCTION public.fc_get_user_permissions(p_user_id bigint) TO service_role;


--
-- Name: FUNCTION fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO postgres;

GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO anon;

GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO authenticated;

GRANT ALL ON FUNCTION public.fc_imgproxy_sign_url(key_hex text, salt_hex text, transforms text, img_url text, imgproxy_url text, is_web boolean) TO service_role;


--
-- Name: FUNCTION fc_import_orders_visits_contracts_update_finger_print(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO postgres;

GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO anon;

GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO authenticated;

GRANT ALL ON FUNCTION public.fc_import_orders_visits_contracts_update_finger_print() TO service_role;


--
-- Name: FUNCTION fc_leader_tracker_interval(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO postgres;

GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO anon;

GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO authenticated;

GRANT ALL ON FUNCTION public.fc_leader_tracker_interval() TO service_role;


--
-- Name: FUNCTION fc_materials_searchable(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_materials_searchable() TO postgres;

GRANT ALL ON FUNCTION public.fc_materials_searchable() TO anon;

GRANT ALL ON FUNCTION public.fc_materials_searchable() TO authenticated;

GRANT ALL ON FUNCTION public.fc_materials_searchable() TO service_role;


--
-- Name: FUNCTION fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO postgres;

GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO anon;

GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_order_counter_increment(p_company_id bigint, p_year integer, p_version text) TO service_role;


--
-- Name: FUNCTION fc_order_status_inheritance(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO postgres;

GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO anon;

GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO authenticated;

GRANT ALL ON FUNCTION public.fc_order_status_inheritance() TO service_role;


--
-- Name: FUNCTION fc_orders_op_counter_trigger(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_op_counter_trigger() TO service_role;


--
-- Name: FUNCTION fc_orders_replace_special_chars(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_replace_special_chars() TO service_role;


--
-- Name: TABLE cfg_orders_types_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_types_activities TO postgres;

GRANT ALL ON TABLE public.cfg_orders_types_activities TO anon;

GRANT ALL ON TABLE public.cfg_orders_types_activities TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_types_activities TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_types_activities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_types_activities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_types_activities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_types_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_types_activities TO postgres;

GRANT ALL ON TABLE public.v_orders_types_activities TO anon;

GRANT ALL ON TABLE public.v_orders_types_activities TO authenticated;

GRANT ALL ON TABLE public.v_orders_types_activities TO service_role;

GRANT SELECT ON TABLE public.v_orders_types_activities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_types_activities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_types_activities TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_orders_types_activities_search(srch_terms text, srch_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO anon;

GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_types_activities_search(srch_terms text, srch_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_activities_description(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_activities_description() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_materials_update_value_total(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_materials_update_value_total() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_activities_searchable(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_activities_searchable() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_materials_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_materials_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_services_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_services_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_assets_update_vehicles_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_assets_update_vehicles_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_extras_teams_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_extras_teams_update() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_services_amount_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_amount_update() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_services_update_services_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_services_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_services_update_value_unit(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_services_update_value_unit() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_teams_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_teams_update() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_update_total_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_update_total_value() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_vehicles_before_save(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_before_save() TO service_role;


--
-- Name: FUNCTION fc_orders_visits_vehicles_update_vehicles_value(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO postgres;

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO anon;

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO authenticated;

GRANT ALL ON FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value() TO service_role;


--
-- Name: FUNCTION fc_regenerate_asset_description(p_asset_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO postgres;

GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO anon;

GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO authenticated;

GRANT ALL ON FUNCTION public.fc_regenerate_asset_description(p_asset_id bigint) TO service_role;


--
-- Name: FUNCTION fc_set_ov_started_date_parts(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO postgres;

GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO anon;

GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO authenticated;

GRANT ALL ON FUNCTION public.fc_set_ov_started_date_parts() TO service_role;


--
-- Name: FUNCTION fc_sync_ov_costs_status(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO postgres;

GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO anon;

GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO authenticated;

GRANT ALL ON FUNCTION public.fc_sync_ov_costs_status() TO service_role;


--
-- Name: FUNCTION fc_system_parent_id_10_at_id_33_46_uata_rate(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO postgres;

GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO anon;

GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO authenticated;

GRANT ALL ON FUNCTION public.fc_system_parent_id_10_at_id_33_46_uata_rate() TO service_role;


--
-- Name: FUNCTION fc_team_descendants(team_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO postgres;

GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO anon;

GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO authenticated;

GRANT ALL ON FUNCTION public.fc_team_descendants(team_id bigint) TO service_role;


--
-- Name: FUNCTION fc_tgr_units_searchable(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO postgres;

GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO anon;

GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO authenticated;

GRANT ALL ON FUNCTION public.fc_tgr_units_searchable() TO service_role;


--
-- Name: TABLE technicals_manuals; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.technicals_manuals TO postgres;

GRANT ALL ON TABLE public.technicals_manuals TO anon;

GRANT ALL ON TABLE public.technicals_manuals TO authenticated;

GRANT ALL ON TABLE public.technicals_manuals TO service_role;

GRANT SELECT ON TABLE public.technicals_manuals TO "databasus-e163795d";

GRANT SELECT ON TABLE public.technicals_manuals TO "databasus-93da8106";

GRANT SELECT ON TABLE public.technicals_manuals TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_technicals_manuals; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_technicals_manuals TO postgres;

GRANT ALL ON TABLE public.v_technicals_manuals TO anon;

GRANT ALL ON TABLE public.v_technicals_manuals TO authenticated;

GRANT ALL ON TABLE public.v_technicals_manuals TO service_role;

GRANT SELECT ON TABLE public.v_technicals_manuals TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_technicals_manuals TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_technicals_manuals TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO postgres;

GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO anon;

GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO authenticated;

GRANT ALL ON FUNCTION public.fc_tm_assets_types_search_terms(search_terms text, src_asset_type_id integer) TO service_role;


--
-- Name: FUNCTION fc_total_value_update(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_total_value_update() TO postgres;

GRANT ALL ON FUNCTION public.fc_total_value_update() TO anon;

GRANT ALL ON FUNCTION public.fc_total_value_update() TO authenticated;

GRANT ALL ON FUNCTION public.fc_total_value_update() TO service_role;


--
-- Name: FUNCTION fc_unit_05_assets_tags_available_rate(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO postgres;

GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO anon;

GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO authenticated;

GRANT ALL ON FUNCTION public.fc_unit_05_assets_tags_available_rate() TO service_role;


--
-- Name: TABLE cfg_units_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_units_assets_tags TO postgres;

GRANT ALL ON TABLE public.cfg_units_assets_tags TO anon;

GRANT ALL ON TABLE public.cfg_units_assets_tags TO authenticated;

GRANT ALL ON TABLE public.cfg_units_assets_tags TO service_role;

GRANT SELECT ON TABLE public.cfg_units_assets_tags TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_units_assets_tags TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_units_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_by_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_by_assets_tags TO postgres;

GRANT ALL ON TABLE public.v_units_by_assets_tags TO anon;

GRANT ALL ON TABLE public.v_units_by_assets_tags TO authenticated;

GRANT ALL ON TABLE public.v_units_by_assets_tags TO service_role;

GRANT SELECT ON TABLE public.v_units_by_assets_tags TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_by_assets_tags TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_by_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO postgres;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO anon;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_available_rate_search_filters(system_parent_id_value integer, systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], units_ids integer[], asset_tag_id_value integer, offset_value integer, limit_value integer) TO service_role;


--
-- Name: TABLE cfg_assets_available_processing; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_available_processing TO postgres;

GRANT ALL ON TABLE public.cfg_assets_available_processing TO anon;

GRANT ALL ON TABLE public.cfg_assets_available_processing TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_available_processing TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_available_processing TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_available_processing TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_available_processing TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_unavailable_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO postgres;

GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO anon;

GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_unavailable_reasons TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_unavailable_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_unavailable_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_unavailable_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags TO postgres;

GRANT ALL ON TABLE public.v_units_assets_tags TO anon;

GRANT ALL ON TABLE public.v_units_assets_tags TO authenticated;

GRANT ALL ON TABLE public.v_units_assets_tags TO service_role;

GRANT SELECT ON TABLE public.v_units_assets_tags TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_assets_tags TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_units_assets_tags_search_filters(system_parent_id_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO postgres;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO anon;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_search_filters(system_parent_id_value integer) TO service_role;


--
-- Name: FUNCTION fc_units_assets_tags_update_asset_tag_description(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO postgres;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO anon;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_description() TO service_role;


--
-- Name: FUNCTION fc_units_assets_tags_update_asset_tag_sub_description(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO postgres;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO anon;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description() TO service_role;


--
-- Name: FUNCTION fc_units_assets_tags_update_op_counter(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO postgres;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO anon;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_assets_tags_update_op_counter() TO service_role;


--
-- Name: TABLE cfg_units_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_units_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_units_statuses TO anon;

GRANT ALL ON TABLE public.cfg_units_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_units_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_units_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_units_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_units_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units TO postgres;

GRANT ALL ON TABLE public.v_units TO anon;

GRANT ALL ON TABLE public.v_units TO authenticated;

GRANT ALL ON TABLE public.v_units TO service_role;

GRANT SELECT ON TABLE public.v_units TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units TO "databasus-3a3c9dfb";


--
-- Name: FUNCTION fc_units_search(search_terms character varying, search_version character varying); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO postgres;

GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO anon;

GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_search(search_terms character varying, search_version character varying) TO service_role;


--
-- Name: FUNCTION fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO postgres;

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO anon;

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text) TO service_role;


--
-- Name: FUNCTION fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO postgres;

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO anon;

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO authenticated;

GRANT ALL ON FUNCTION public.fc_units_search_filters(systems_parent_ids integer[], systems_ids integer[], units_types_parent_ids integer[], units_types_ids integer[], unit_status_id integer, search_terms text, app_version_mode text, offset_value integer, limit_value integer) TO service_role;


--
-- Name: FUNCTION fc_update_after_img_file_name(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO postgres;

GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO anon;

GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO authenticated;

GRANT ALL ON FUNCTION public.fc_update_after_img_file_name() TO service_role;


--
-- Name: FUNCTION fc_update_after_img_files_names(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO postgres;

GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO anon;

GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO authenticated;

GRANT ALL ON FUNCTION public.fc_update_after_img_files_names() TO service_role;


--
-- Name: FUNCTION fc_update_before_img_file_name(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO postgres;

GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO anon;

GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO authenticated;

GRANT ALL ON FUNCTION public.fc_update_before_img_file_name() TO service_role;


--
-- Name: FUNCTION fc_update_before_img_files_names(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO postgres;

GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO anon;

GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO authenticated;

GRANT ALL ON FUNCTION public.fc_update_before_img_files_names() TO service_role;


--
-- Name: FUNCTION fc_update_op_counter(p_unit_asset_tag_id bigint); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO postgres;

GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO anon;

GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO authenticated;

GRANT ALL ON FUNCTION public.fc_update_op_counter(p_unit_asset_tag_id bigint) TO service_role;


--
-- Name: FUNCTION fc_update_profile_routes(p_profile_id bigint, p_routes jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO postgres;

GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO anon;

GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO authenticated;

GRANT ALL ON FUNCTION public.fc_update_profile_routes(p_profile_id bigint, p_routes jsonb) TO service_role;


--
-- Name: FUNCTION flow_order_visit_close_v2(payload jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO postgres;

GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO anon;

GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO authenticated;

GRANT ALL ON FUNCTION public.flow_order_visit_close_v2(payload jsonb) TO service_role;


--
-- Name: FUNCTION flow_order_visit_create_v2(payload jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO postgres;

GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO anon;

GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO authenticated;

GRANT ALL ON FUNCTION public.flow_order_visit_create_v2(payload jsonb) TO service_role;


--
-- Name: FUNCTION fn_audit_visit_costs_status(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO postgres;

GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO anon;

GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO authenticated;

GRANT ALL ON FUNCTION public.fn_audit_visit_costs_status() TO service_role;


--
-- Name: FUNCTION generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO postgres;

GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO anon;

GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO authenticated;

GRANT ALL ON FUNCTION public.generate_impersonation_link(p_target_user_id bigint, p_redirect_to text, p_service_role_key text) TO service_role;


--
-- Name: FUNCTION get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO postgres;

GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO anon;

GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO authenticated;

GRANT ALL ON FUNCTION public.get_users_within_distance(user_lat double precision, user_lon double precision, max_dist_km double precision, min_age integer, max_age integer) TO service_role;


--
-- Name: FUNCTION handle_followers_orders_status_changed(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO postgres;

GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO anon;

GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO authenticated;

GRANT ALL ON FUNCTION public.handle_followers_orders_status_changed() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_new_user() TO postgres;

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;

GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;

GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION handle_notifications_count(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_notifications_count() TO postgres;

GRANT ALL ON FUNCTION public.handle_notifications_count() TO anon;

GRANT ALL ON FUNCTION public.handle_notifications_count() TO authenticated;

GRANT ALL ON FUNCTION public.handle_notifications_count() TO service_role;


--
-- Name: FUNCTION handle_profile_photo_change_notification(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO postgres;

GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO anon;

GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO authenticated;

GRANT ALL ON FUNCTION public.handle_profile_photo_change_notification() TO service_role;


--
-- Name: FUNCTION handle_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.handle_updated_at() TO postgres;

GRANT ALL ON FUNCTION public.handle_updated_at() TO anon;

GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;


--
-- Name: FUNCTION match_documents(query_embedding extensions.vector, match_count integer, filter jsonb); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO postgres;

GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO anon;

GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO authenticated;

GRANT ALL ON FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) TO service_role;


--
-- Name: FUNCTION match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO postgres;

GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO anon;

GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO authenticated;

GRANT ALL ON FUNCTION public.match_knowledge(query_embedding extensions.vector, match_threshold double precision, match_count integer) TO service_role;


--
-- Name: FUNCTION nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO postgres;

GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO anon;

GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO authenticated;

GRANT ALL ON FUNCTION public.nearby_units(user_lat double precision, user_lng double precision, radius_meters double precision, status_filter text) TO service_role;


--
-- Name: FUNCTION recalculate_all_scores(p_year integer, p_month integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO postgres;

GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO anon;

GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO authenticated;

GRANT ALL ON FUNCTION public.recalculate_all_scores(p_year integer, p_month integer) TO service_role;


--
-- Name: FUNCTION recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO postgres;

GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO anon;

GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO authenticated;

GRANT ALL ON FUNCTION public.recalculate_department_scores(p_department_id bigint, p_year integer, p_month integer) TO service_role;


--
-- Name: FUNCTION recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO postgres;

GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO anon;

GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO authenticated;

GRANT ALL ON FUNCTION public.recalculate_leader_monthly_score(p_leader_id bigint, p_year integer, p_month integer) TO service_role;


--
-- Name: FUNCTION restore_original_password(p_user_uuid uuid); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO postgres;

GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO anon;

GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO authenticated;

GRANT ALL ON FUNCTION public.restore_original_password(p_user_uuid uuid) TO service_role;


--
-- Name: FUNCTION update_cfg_app_notices_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO postgres;

GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO anon;

GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.update_cfg_app_notices_updated_at() TO service_role;


--
-- Name: FUNCTION update_cfg_app_tips_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO postgres;

GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO anon;

GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.update_cfg_app_tips_updated_at() TO service_role;


--
-- Name: FUNCTION update_system_notices_updated_at(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO postgres;

GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO anon;

GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.update_system_notices_updated_at() TO service_role;


--
-- Name: FUNCTION update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO postgres;

GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO anon;

GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO authenticated;

GRANT ALL ON FUNCTION public.update_unit_asset_tag_availability(p_unit_asset_tag_id integer, p_is_available boolean, p_reason_id integer, p_comments text, p_reported_by_id integer, p_file_path text, p_file_name text, p_unit_id integer, p_asset_tag_id integer, p_asset_tag_sub_id integer, p_operation_record numeric, p_created_at text, p_reported_at text, p_reported_latitude double precision, p_reported_longitude double precision, p_unit_latitude double precision, p_unit_longitude double precision, p_unit_reported_distance double precision, p_provider_company_id integer, p_is_web boolean) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.audit_log_entries TO postgres;

GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.flow_state TO postgres;

GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.identities TO postgres;

GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.instances TO postgres;

GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;

GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_challenges TO postgres;

GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.mfa_factors TO postgres;

GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;

GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;

GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;

GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.one_time_tokens TO postgres;

GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.refresh_tokens TO postgres;

GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_providers TO postgres;

GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.saml_relay_states TO postgres;

GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.schema_migrations TO dashboard_user;

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.schema_migrations TO postgres;

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sessions TO postgres;

GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_domains TO postgres;

GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.sso_providers TO postgres;

GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;

GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE auth.users TO postgres;

GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE ai_chat_histories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_chat_histories TO postgres;

GRANT ALL ON TABLE public.ai_chat_histories TO anon;

GRANT ALL ON TABLE public.ai_chat_histories TO authenticated;

GRANT ALL ON TABLE public.ai_chat_histories TO service_role;

GRANT SELECT ON TABLE public.ai_chat_histories TO "databasus-e163795d";

GRANT SELECT ON TABLE public.ai_chat_histories TO "databasus-93da8106";

GRANT SELECT ON TABLE public.ai_chat_histories TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE ai_chat_histories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO anon;

GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.ai_chat_histories_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.ai_chat_histories_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.ai_chat_histories_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.ai_chat_histories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE ai_chat_sessions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_chat_sessions TO postgres;

GRANT ALL ON TABLE public.ai_chat_sessions TO anon;

GRANT ALL ON TABLE public.ai_chat_sessions TO authenticated;

GRANT ALL ON TABLE public.ai_chat_sessions TO service_role;

GRANT SELECT ON TABLE public.ai_chat_sessions TO "databasus-e163795d";

GRANT SELECT ON TABLE public.ai_chat_sessions TO "databasus-93da8106";

GRANT SELECT ON TABLE public.ai_chat_sessions TO "databasus-3a3c9dfb";


--
-- Name: TABLE ai_knowledge; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_knowledge TO postgres;

GRANT ALL ON TABLE public.ai_knowledge TO anon;

GRANT ALL ON TABLE public.ai_knowledge TO authenticated;

GRANT ALL ON TABLE public.ai_knowledge TO service_role;

GRANT SELECT ON TABLE public.ai_knowledge TO "databasus-e163795d";

GRANT SELECT ON TABLE public.ai_knowledge TO "databasus-93da8106";

GRANT SELECT ON TABLE public.ai_knowledge TO "databasus-3a3c9dfb";


--
-- Name: TABLE ai_messages; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.ai_messages TO postgres;

GRANT ALL ON TABLE public.ai_messages TO anon;

GRANT ALL ON TABLE public.ai_messages TO authenticated;

GRANT ALL ON TABLE public.ai_messages TO service_role;

GRANT SELECT ON TABLE public.ai_messages TO "databasus-e163795d";

GRANT SELECT ON TABLE public.ai_messages TO "databasus-93da8106";

GRANT SELECT ON TABLE public.ai_messages TO "databasus-3a3c9dfb";


--
-- Name: TABLE api_keys; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.api_keys TO postgres;

GRANT ALL ON TABLE public.api_keys TO anon;

GRANT ALL ON TABLE public.api_keys TO authenticated;

GRANT ALL ON TABLE public.api_keys TO service_role;

GRANT SELECT ON TABLE public.api_keys TO "databasus-e163795d";

GRANT SELECT ON TABLE public.api_keys TO "databasus-93da8106";

GRANT SELECT ON TABLE public.api_keys TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE api_keys_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.api_keys_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.api_keys_id_seq TO anon;

GRANT ALL ON SEQUENCE public.api_keys_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.api_keys_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.api_keys_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.api_keys_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.api_keys_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_alerts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_alerts TO postgres;

GRANT ALL ON TABLE public.assets_alerts TO anon;

GRANT ALL ON TABLE public.assets_alerts TO authenticated;

GRANT ALL ON TABLE public.assets_alerts TO service_role;

GRANT SELECT ON TABLE public.assets_alerts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_alerts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_alerts TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_alerts_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_alerts_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_alerts_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_alerts_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_alerts_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_attributes_values; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_attributes_values TO postgres;

GRANT ALL ON TABLE public.assets_attributes_values TO anon;

GRANT ALL ON TABLE public.assets_attributes_values TO authenticated;

GRANT ALL ON TABLE public.assets_attributes_values TO service_role;

GRANT SELECT ON TABLE public.assets_attributes_values TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_attributes_values TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_attributes_values TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_available; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_available TO postgres;

GRANT ALL ON TABLE public.assets_available TO anon;

GRANT ALL ON TABLE public.assets_available TO authenticated;

GRANT ALL ON TABLE public.assets_available TO service_role;

GRANT SELECT ON TABLE public.assets_available TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_available TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_available TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_available_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_available_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_available_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_available_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_available_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_available_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_available_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_available_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_followers TO postgres;

GRANT ALL ON TABLE public.assets_followers TO anon;

GRANT ALL ON TABLE public.assets_followers TO authenticated;

GRANT ALL ON TABLE public.assets_followers TO service_role;

GRANT SELECT ON TABLE public.assets_followers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_followers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_followers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_followers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_followers_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_followers_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_followers_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_followers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_loans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_loans TO postgres;

GRANT ALL ON TABLE public.assets_loans TO anon;

GRANT ALL ON TABLE public.assets_loans TO authenticated;

GRANT ALL ON TABLE public.assets_loans TO service_role;

GRANT SELECT ON TABLE public.assets_loans TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_loans TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_loans TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_loans_checklists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_loans_checklists TO postgres;

GRANT ALL ON TABLE public.assets_loans_checklists TO anon;

GRANT ALL ON TABLE public.assets_loans_checklists TO authenticated;

GRANT ALL ON TABLE public.assets_loans_checklists TO service_role;

GRANT SELECT ON TABLE public.assets_loans_checklists TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_loans_checklists TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_loans_checklists TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_loans_checklists_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_loans_checklists_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_loans_checklists_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_loans_checklists_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_loans_checklists_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_loans_checklists_images; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_loans_checklists_images TO postgres;

GRANT ALL ON TABLE public.assets_loans_checklists_images TO anon;

GRANT ALL ON TABLE public.assets_loans_checklists_images TO authenticated;

GRANT ALL ON TABLE public.assets_loans_checklists_images TO service_role;

GRANT SELECT ON TABLE public.assets_loans_checklists_images TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_loans_checklists_images TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_loans_checklists_images TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_loans_checklists_images_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_loans_checklists_images_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_loans_checklists_images_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_loans_checklists_images_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_loans_checklists_images_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_loans_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_loans_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_loans_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_loans_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_loans_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.assets_materials TO postgres;

GRANT ALL ON TABLE public.assets_materials TO anon;

GRANT ALL ON TABLE public.assets_materials TO authenticated;

GRANT ALL ON TABLE public.assets_materials TO service_role;

GRANT SELECT ON TABLE public.assets_materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.assets_materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.assets_materials TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE assets_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO anon;

GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.assets_materials_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.assets_materials_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.assets_materials_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.assets_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE audits_logs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.audits_logs TO postgres;

GRANT ALL ON TABLE public.audits_logs TO anon;

GRANT ALL ON TABLE public.audits_logs TO authenticated;

GRANT ALL ON TABLE public.audits_logs TO service_role;

GRANT SELECT ON TABLE public.audits_logs TO "databasus-e163795d";

GRANT SELECT ON TABLE public.audits_logs TO "databasus-93da8106";

GRANT SELECT ON TABLE public.audits_logs TO "databasus-3a3c9dfb";


--
-- Name: TABLE carts_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.carts_materials TO postgres;

GRANT ALL ON TABLE public.carts_materials TO anon;

GRANT ALL ON TABLE public.carts_materials TO authenticated;

GRANT ALL ON TABLE public.carts_materials TO service_role;

GRANT SELECT ON TABLE public.carts_materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.carts_materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.carts_materials TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE carts_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO anon;

GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.carts_materials_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.carts_materials_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.carts_materials_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.carts_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_activities_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_activities_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_activities_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app TO postgres;

GRANT ALL ON TABLE public.cfg_app TO anon;

GRANT ALL ON TABLE public.cfg_app TO authenticated;

GRANT ALL ON TABLE public.cfg_app TO service_role;

GRANT SELECT ON TABLE public.cfg_app TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_notices; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_notices TO postgres;

GRANT ALL ON TABLE public.cfg_app_notices TO anon;

GRANT ALL ON TABLE public.cfg_app_notices TO authenticated;

GRANT ALL ON TABLE public.cfg_app_notices TO service_role;

GRANT SELECT ON TABLE public.cfg_app_notices TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_notices TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_notices TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_notices_categories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_notices_categories TO postgres;

GRANT ALL ON TABLE public.cfg_app_notices_categories TO anon;

GRANT ALL ON TABLE public.cfg_app_notices_categories TO authenticated;

GRANT ALL ON TABLE public.cfg_app_notices_categories TO service_role;

GRANT SELECT ON TABLE public.cfg_app_notices_categories TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_notices_categories TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_notices_categories TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_notices_severities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_notices_severities TO postgres;

GRANT ALL ON TABLE public.cfg_app_notices_severities TO anon;

GRANT ALL ON TABLE public.cfg_app_notices_severities TO authenticated;

GRANT ALL ON TABLE public.cfg_app_notices_severities TO service_role;

GRANT SELECT ON TABLE public.cfg_app_notices_severities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_notices_severities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_notices_severities TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_offline_updates; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_offline_updates TO postgres;

GRANT ALL ON TABLE public.cfg_app_offline_updates TO anon;

GRANT ALL ON TABLE public.cfg_app_offline_updates TO authenticated;

GRANT ALL ON TABLE public.cfg_app_offline_updates TO service_role;

GRANT SELECT ON TABLE public.cfg_app_offline_updates TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_offline_updates TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_offline_updates TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_offline_updates_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_offline_updates_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_offline_updates_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_offline_updates_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_offline_updates_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_pages; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_pages TO postgres;

GRANT ALL ON TABLE public.cfg_app_pages TO anon;

GRANT ALL ON TABLE public.cfg_app_pages TO authenticated;

GRANT ALL ON TABLE public.cfg_app_pages TO service_role;

GRANT SELECT ON TABLE public.cfg_app_pages TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_pages TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_pages TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_pages_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_pages_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_pages_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_pages_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_pages_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips TO postgres;

GRANT ALL ON TABLE public.cfg_app_tips TO anon;

GRANT ALL ON TABLE public.cfg_app_tips TO authenticated;

GRANT ALL ON TABLE public.cfg_app_tips TO service_role;

GRANT SELECT ON TABLE public.cfg_app_tips TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_tips TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_tips TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_companies; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_companies TO postgres;

GRANT ALL ON TABLE public.cfg_app_tips_companies TO anon;

GRANT ALL ON TABLE public.cfg_app_tips_companies TO authenticated;

GRANT ALL ON TABLE public.cfg_app_tips_companies TO service_role;

GRANT SELECT ON TABLE public.cfg_app_tips_companies TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_tips_companies TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_tips_companies TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_companies_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_tips_companies_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_tips_companies_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_companies_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_companies_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_departments; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_departments TO postgres;

GRANT ALL ON TABLE public.cfg_app_tips_departments TO anon;

GRANT ALL ON TABLE public.cfg_app_tips_departments TO authenticated;

GRANT ALL ON TABLE public.cfg_app_tips_departments TO service_role;

GRANT SELECT ON TABLE public.cfg_app_tips_departments TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_tips_departments TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_tips_departments TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_departments_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_tips_departments_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_tips_departments_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_departments_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_departments_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_dismissals; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO postgres;

GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO anon;

GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO authenticated;

GRANT ALL ON TABLE public.cfg_app_tips_dismissals TO service_role;

GRANT SELECT ON TABLE public.cfg_app_tips_dismissals TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_tips_dismissals TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_tips_dismissals TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_dismissals_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_dismissals_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_new_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_tips_new_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_tips_new_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_new_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_new_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_tips_profiles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_tips_profiles TO postgres;

GRANT ALL ON TABLE public.cfg_app_tips_profiles TO anon;

GRANT ALL ON TABLE public.cfg_app_tips_profiles TO authenticated;

GRANT ALL ON TABLE public.cfg_app_tips_profiles TO service_role;

GRANT SELECT ON TABLE public.cfg_app_tips_profiles TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_tips_profiles TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_tips_profiles TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_tips_profiles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_tips_profiles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_app_versions_update; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_app_versions_update TO postgres;

GRANT ALL ON TABLE public.cfg_app_versions_update TO anon;

GRANT ALL ON TABLE public.cfg_app_versions_update TO authenticated;

GRANT ALL ON TABLE public.cfg_app_versions_update TO service_role;

GRANT SELECT ON TABLE public.cfg_app_versions_update TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_app_versions_update TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_app_versions_update TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_app_versions_update_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_app_versions_update_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_app_versions_update_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_app_versions_update_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_app_versions_update_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_attributes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_attributes TO postgres;

GRANT ALL ON TABLE public.cfg_assets_attributes TO anon;

GRANT ALL ON TABLE public.cfg_assets_attributes TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_attributes TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_attributes TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_attributes TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_attributes TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_attributes_groups; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO postgres;

GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO anon;

GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_attributes_groups TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_attributes_groups TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_attributes_groups TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_attributes_groups TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_attributes_groups_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_groups_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_attributes_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_attributes_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_attributes_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_available_processing_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_available_processing_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_available_processing_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_available_processing_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_available_processing_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_couplings_models_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_couplings_models_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_priorities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_priorities_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_priorities_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_priorities_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_priorities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_types_attributes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_types_attributes TO postgres;

GRANT ALL ON TABLE public.cfg_assets_types_attributes TO anon;

GRANT ALL ON TABLE public.cfg_assets_types_attributes TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_types_attributes TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_types_attributes TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_types_attributes TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_types_attributes TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_types_attributes_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_types_attributes_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_assets_types_loans_checklists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO postgres;

GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO anon;

GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO authenticated;

GRANT ALL ON TABLE public.cfg_assets_types_loans_checklists TO service_role;

GRANT SELECT ON TABLE public.cfg_assets_types_loans_checklists TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_assets_types_loans_checklists TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_assets_types_loans_checklists TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_types_loans_checklists_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_types_loans_checklists_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_assets_unavailable_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_assets_unavailable_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_companies_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_companies_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_companies_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_companies_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_companies_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_contracts_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_contracts_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_contracts_statuses TO anon;

GRANT ALL ON TABLE public.cfg_contracts_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_contracts_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_contracts_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_contracts_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_contracts_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_contracts_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_contracts_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_contracts_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_contracts_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_contracts_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_departments; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_departments TO postgres;

GRANT ALL ON TABLE public.cfg_departments TO anon;

GRANT ALL ON TABLE public.cfg_departments TO authenticated;

GRANT ALL ON TABLE public.cfg_departments TO service_role;

GRANT SELECT ON TABLE public.cfg_departments TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_departments TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_departments TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_departments_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_departments_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_departments_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_departments_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_departments_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_evaluation_requirements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_evaluation_requirements TO postgres;

GRANT ALL ON TABLE public.cfg_evaluation_requirements TO anon;

GRANT ALL ON TABLE public.cfg_evaluation_requirements TO authenticated;

GRANT ALL ON TABLE public.cfg_evaluation_requirements TO service_role;

GRANT SELECT ON TABLE public.cfg_evaluation_requirements TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_evaluation_requirements TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_evaluation_requirements TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_evaluation_requirements_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_evaluation_requirements_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_loans_checklists; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_loans_checklists TO postgres;

GRANT ALL ON TABLE public.cfg_loans_checklists TO anon;

GRANT ALL ON TABLE public.cfg_loans_checklists TO authenticated;

GRANT ALL ON TABLE public.cfg_loans_checklists TO service_role;

GRANT SELECT ON TABLE public.cfg_loans_checklists TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_loans_checklists TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_loans_checklists TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_loans_checklists_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_loans_checklists_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_loans_checklists_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_loans_checklists_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_loans_checklists_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_purchases_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO anon;

GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_materials_purchases_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_materials_purchases_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_materials_purchases_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_materials_purchases_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_material_purchases_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_material_purchases_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_purchases_cancel_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO postgres;

GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO anon;

GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO authenticated;

GRANT ALL ON TABLE public.cfg_materials_purchases_cancel_reasons TO service_role;

GRANT SELECT ON TABLE public.cfg_materials_purchases_cancel_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_materials_purchases_cancel_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_materials_purchases_cancel_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_purchases_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_purchases_types TO postgres;

GRANT ALL ON TABLE public.cfg_materials_purchases_types TO anon;

GRANT ALL ON TABLE public.cfg_materials_purchases_types TO authenticated;

GRANT ALL ON TABLE public.cfg_materials_purchases_types TO service_role;

GRANT SELECT ON TABLE public.cfg_materials_purchases_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_materials_purchases_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_materials_purchases_types TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_materials_purchases_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_materials_purchases_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_materials_statuses TO anon;

GRANT ALL ON TABLE public.cfg_materials_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_materials_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_materials_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_materials_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_materials_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_materials_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_materials_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_materials_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_materials_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_materials_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_materials_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_materials_types TO postgres;

GRANT ALL ON TABLE public.cfg_materials_types TO anon;

GRANT ALL ON TABLE public.cfg_materials_types TO authenticated;

GRANT ALL ON TABLE public.cfg_materials_types TO service_role;

GRANT SELECT ON TABLE public.cfg_materials_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_materials_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_materials_types TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_materials_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_materials_types_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_materials_types_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_materials_types_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_materials_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_cancel_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_cancel_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_causes_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_causes_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_counter; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_counter TO postgres;

GRANT ALL ON TABLE public.cfg_orders_counter TO anon;

GRANT ALL ON TABLE public.cfg_orders_counter TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_counter TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_counter TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_counter TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_counter TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_counter_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_counter_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_counter_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_counter_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_counter_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_objects_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_objects_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_objects_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_objects_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_objects_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_plans_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_plans_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_plans_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_plans_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_plans_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_priorities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_priorities_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_priorities_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_priorities_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_priorities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_suspended_reasons_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_suspended_reasons_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_types_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_types_activities_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_types_activities_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_types_activities_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_types_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_types_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_types_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_types_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_types_subs_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_types_subs_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_types_subs_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_types_subs_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_types_subs_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_visits_extras_processing_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_extras_processing_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_visits_processing; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_visits_processing TO postgres;

GRANT ALL ON TABLE public.cfg_orders_visits_processing TO anon;

GRANT ALL ON TABLE public.cfg_orders_visits_processing TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_visits_processing TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_visits_processing TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_visits_processing TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_visits_processing TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_visits_processing_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_processing_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_orders_visits_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO anon;

GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_orders_visits_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_orders_visits_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_orders_visits_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_orders_visits_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_orders_visits_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_orders_visits_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_profiles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_profiles TO postgres;

GRANT ALL ON TABLE public.cfg_profiles TO anon;

GRANT ALL ON TABLE public.cfg_profiles TO authenticated;

GRANT ALL ON TABLE public.cfg_profiles TO service_role;

GRANT SELECT ON TABLE public.cfg_profiles TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_profiles TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_profiles TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_profiles_access; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_profiles_access TO postgres;

GRANT ALL ON TABLE public.cfg_profiles_access TO anon;

GRANT ALL ON TABLE public.cfg_profiles_access TO authenticated;

GRANT ALL ON TABLE public.cfg_profiles_access TO service_role;

GRANT SELECT ON TABLE public.cfg_profiles_access TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_profiles_access TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_profiles_access TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_profiles_access_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_profiles_access_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_profiles_access_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_profiles_access_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_profiles_access_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_profiles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_profiles_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_profiles_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_profiles_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_profiles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_profiles_permissions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_profiles_permissions TO postgres;

GRANT ALL ON TABLE public.cfg_profiles_permissions TO anon;

GRANT ALL ON TABLE public.cfg_profiles_permissions TO authenticated;

GRANT ALL ON TABLE public.cfg_profiles_permissions TO service_role;

GRANT SELECT ON TABLE public.cfg_profiles_permissions TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_profiles_permissions TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_profiles_permissions TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_profiles_permissions_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_profiles_permissions_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_profiles_permissions_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_profiles_permissions_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_profiles_permissions_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_routes; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_routes TO postgres;

GRANT ALL ON TABLE public.cfg_routes TO anon;

GRANT ALL ON TABLE public.cfg_routes TO authenticated;

GRANT ALL ON TABLE public.cfg_routes TO service_role;

GRANT SELECT ON TABLE public.cfg_routes TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_routes TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_routes TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_routes_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_routes_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_routes_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_routes_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_routes_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_services_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_services_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_services_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_services_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_services_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_systems_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_systems_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_systems_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_systems_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_systems_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_teams_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_teams_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_teams_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_teams_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_teams_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_technicals_manuals_categories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO postgres;

GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO anon;

GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO authenticated;

GRANT ALL ON TABLE public.cfg_technicals_manuals_categories TO service_role;

GRANT SELECT ON TABLE public.cfg_technicals_manuals_categories TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_technicals_manuals_categories TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_technicals_manuals_categories TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_technicals_manuals_categories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_technicals_manuals_categories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_units_assets_tags_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_units_assets_tags_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_units_assets_tags_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_units_assets_tags_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_units_assets_tags_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_units_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_units_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_units_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_units_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_units_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_units_types_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_units_types_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_units_types_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_units_types_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_units_types_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE cfg_users_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.cfg_users_statuses TO postgres;

GRANT ALL ON TABLE public.cfg_users_statuses TO anon;

GRANT ALL ON TABLE public.cfg_users_statuses TO authenticated;

GRANT ALL ON TABLE public.cfg_users_statuses TO service_role;

GRANT SELECT ON TABLE public.cfg_users_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.cfg_users_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.cfg_users_statuses TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE cfg_users_statuses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cfg_users_statuses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.cfg_users_statuses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.cfg_users_statuses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.cfg_users_statuses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE chat_agent_ai; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.chat_agent_ai TO postgres;

GRANT ALL ON TABLE public.chat_agent_ai TO anon;

GRANT ALL ON TABLE public.chat_agent_ai TO authenticated;

GRANT ALL ON TABLE public.chat_agent_ai TO service_role;

GRANT SELECT ON TABLE public.chat_agent_ai TO "databasus-e163795d";

GRANT SELECT ON TABLE public.chat_agent_ai TO "databasus-93da8106";

GRANT SELECT ON TABLE public.chat_agent_ai TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE chat_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.chat_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.chat_id_seq TO anon;

GRANT ALL ON SEQUENCE public.chat_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.chat_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.chat_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.chat_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.chat_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE clients_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.clients_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.clients_id_seq TO anon;

GRANT ALL ON SEQUENCE public.clients_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.clients_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.clients_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.clients_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.clients_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts_evaluation_requirements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts_evaluation_requirements TO postgres;

GRANT ALL ON TABLE public.contracts_evaluation_requirements TO anon;

GRANT ALL ON TABLE public.contracts_evaluation_requirements TO authenticated;

GRANT ALL ON TABLE public.contracts_evaluation_requirements TO service_role;

GRANT SELECT ON TABLE public.contracts_evaluation_requirements TO "databasus-e163795d";

GRANT SELECT ON TABLE public.contracts_evaluation_requirements TO "databasus-93da8106";

GRANT SELECT ON TABLE public.contracts_evaluation_requirements TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_evaluation_requirements_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO anon;

GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.contracts_evaluation_requirements_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.contracts_id_seq TO anon;

GRANT ALL ON SEQUENCE public.contracts_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.contracts_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.contracts_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.contracts_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.contracts_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE contracts_managers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.contracts_managers TO postgres;

GRANT ALL ON TABLE public.contracts_managers TO anon;

GRANT ALL ON TABLE public.contracts_managers TO authenticated;

GRANT ALL ON TABLE public.contracts_managers TO service_role;

GRANT SELECT ON TABLE public.contracts_managers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.contracts_managers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.contracts_managers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_managers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO anon;

GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.contracts_managers_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.contracts_managers_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.contracts_managers_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.contracts_managers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE contracts_services_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO anon;

GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.contracts_services_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.contracts_services_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.contracts_services_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.contracts_services_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.documents TO postgres;

GRANT ALL ON TABLE public.documents TO anon;

GRANT ALL ON TABLE public.documents TO authenticated;

GRANT ALL ON TABLE public.documents TO service_role;

GRANT SELECT ON TABLE public.documents TO "databasus-e163795d";

GRANT SELECT ON TABLE public.documents TO "databasus-93da8106";

GRANT SELECT ON TABLE public.documents TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE documents_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.documents_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.documents_id_seq TO anon;

GRANT ALL ON SEQUENCE public.documents_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.documents_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.documents_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.documents_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.documents_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE extensions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.extensions TO postgres;

GRANT ALL ON TABLE public.extensions TO anon;

GRANT ALL ON TABLE public.extensions TO authenticated;

GRANT ALL ON TABLE public.extensions TO service_role;

GRANT SELECT ON TABLE public.extensions TO "databasus-e163795d";

GRANT SELECT ON TABLE public.extensions TO "databasus-93da8106";

GRANT SELECT ON TABLE public.extensions TO "databasus-3a3c9dfb";


--
-- Name: TABLE goose_db_version; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.goose_db_version TO anon;

GRANT ALL ON TABLE public.goose_db_version TO authenticated;

GRANT ALL ON TABLE public.goose_db_version TO service_role;


--
-- Name: SEQUENCE goose_db_version_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.goose_db_version_id_seq TO anon;

GRANT ALL ON SEQUENCE public.goose_db_version_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.goose_db_version_id_seq TO service_role;


--
-- Name: TABLE impersonation_password_backup; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.impersonation_password_backup TO postgres;

GRANT ALL ON TABLE public.impersonation_password_backup TO anon;

GRANT ALL ON TABLE public.impersonation_password_backup TO authenticated;

GRANT ALL ON TABLE public.impersonation_password_backup TO service_role;

GRANT SELECT ON TABLE public.impersonation_password_backup TO "databasus-e163795d";

GRANT SELECT ON TABLE public.impersonation_password_backup TO "databasus-93da8106";

GRANT SELECT ON TABLE public.impersonation_password_backup TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE impersonation_password_backup_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO anon;

GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.impersonation_password_backup_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.impersonation_password_backup_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.impersonation_password_backup_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.impersonation_password_backup_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE import_orders_visits_contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.import_orders_visits_contracts TO postgres;

GRANT ALL ON TABLE public.import_orders_visits_contracts TO anon;

GRANT ALL ON TABLE public.import_orders_visits_contracts TO authenticated;

GRANT ALL ON TABLE public.import_orders_visits_contracts TO service_role;

GRANT SELECT ON TABLE public.import_orders_visits_contracts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.import_orders_visits_contracts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.import_orders_visits_contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE leader_monthly_scores; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.leader_monthly_scores TO postgres;

GRANT ALL ON TABLE public.leader_monthly_scores TO anon;

GRANT ALL ON TABLE public.leader_monthly_scores TO authenticated;

GRANT ALL ON TABLE public.leader_monthly_scores TO service_role;

GRANT SELECT ON TABLE public.leader_monthly_scores TO "databasus-e163795d";

GRANT SELECT ON TABLE public.leader_monthly_scores TO "databasus-93da8106";

GRANT SELECT ON TABLE public.leader_monthly_scores TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE leader_monthly_scores_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO anon;

GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.leader_monthly_scores_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.leader_monthly_scores_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.leader_monthly_scores_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.leader_monthly_scores_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE leader_score_badges; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.leader_score_badges TO postgres;

GRANT ALL ON TABLE public.leader_score_badges TO anon;

GRANT ALL ON TABLE public.leader_score_badges TO authenticated;

GRANT ALL ON TABLE public.leader_score_badges TO service_role;

GRANT SELECT ON TABLE public.leader_score_badges TO "databasus-e163795d";

GRANT SELECT ON TABLE public.leader_score_badges TO "databasus-93da8106";

GRANT SELECT ON TABLE public.leader_score_badges TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE leader_score_badges_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO anon;

GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.leader_score_badges_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.leader_score_badges_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.leader_score_badges_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.leader_score_badges_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE leader_scores_history; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.leader_scores_history TO postgres;

GRANT ALL ON TABLE public.leader_scores_history TO anon;

GRANT ALL ON TABLE public.leader_scores_history TO authenticated;

GRANT ALL ON TABLE public.leader_scores_history TO service_role;

GRANT SELECT ON TABLE public.leader_scores_history TO "databasus-e163795d";

GRANT SELECT ON TABLE public.leader_scores_history TO "databasus-93da8106";

GRANT SELECT ON TABLE public.leader_scores_history TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE leader_scores_history_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO anon;

GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.leader_scores_history_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.leader_scores_history_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.leader_scores_history_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.leader_scores_history_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE logs_api; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.logs_api TO postgres;

GRANT ALL ON TABLE public.logs_api TO anon;

GRANT ALL ON TABLE public.logs_api TO authenticated;

GRANT ALL ON TABLE public.logs_api TO service_role;

GRANT SELECT ON TABLE public.logs_api TO "databasus-e163795d";

GRANT SELECT ON TABLE public.logs_api TO "databasus-93da8106";

GRANT SELECT ON TABLE public.logs_api TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE logs_api_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.logs_api_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.logs_api_id_seq TO anon;

GRANT ALL ON SEQUENCE public.logs_api_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.logs_api_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.logs_api_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.logs_api_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.logs_api_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE logs_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.logs_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.logs_id_seq TO anon;

GRANT ALL ON SEQUENCE public.logs_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.logs_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.logs_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.logs_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.logs_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE maintenances_plans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.maintenances_plans TO postgres;

GRANT ALL ON TABLE public.maintenances_plans TO anon;

GRANT ALL ON TABLE public.maintenances_plans TO authenticated;

GRANT ALL ON TABLE public.maintenances_plans TO service_role;

GRANT SELECT ON TABLE public.maintenances_plans TO "databasus-e163795d";

GRANT SELECT ON TABLE public.maintenances_plans TO "databasus-93da8106";

GRANT SELECT ON TABLE public.maintenances_plans TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE maintenances_plans_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO anon;

GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.maintenances_plans_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.maintenances_plans_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.maintenances_plans_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.maintenances_plans_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE maintenances_plans_sections; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.maintenances_plans_sections TO postgres;

GRANT ALL ON TABLE public.maintenances_plans_sections TO anon;

GRANT ALL ON TABLE public.maintenances_plans_sections TO authenticated;

GRANT ALL ON TABLE public.maintenances_plans_sections TO service_role;

GRANT SELECT ON TABLE public.maintenances_plans_sections TO "databasus-e163795d";

GRANT SELECT ON TABLE public.maintenances_plans_sections TO "databasus-93da8106";

GRANT SELECT ON TABLE public.maintenances_plans_sections TO "databasus-3a3c9dfb";


--
-- Name: TABLE maintenances_plans_sections_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO postgres;

GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO anon;

GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO authenticated;

GRANT ALL ON TABLE public.maintenances_plans_sections_activities TO service_role;

GRANT SELECT ON TABLE public.maintenances_plans_sections_activities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.maintenances_plans_sections_activities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.maintenances_plans_sections_activities TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE maintenances_plans_sections_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO anon;

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE maintenances_plans_sections_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO anon;

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.maintenances_plans_sections_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.maintenances_plans_sections_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE materials_purchases; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.materials_purchases TO postgres;

GRANT ALL ON TABLE public.materials_purchases TO anon;

GRANT ALL ON TABLE public.materials_purchases TO authenticated;

GRANT ALL ON TABLE public.materials_purchases TO service_role;

GRANT SELECT ON TABLE public.materials_purchases TO "databasus-e163795d";

GRANT SELECT ON TABLE public.materials_purchases TO "databasus-93da8106";

GRANT SELECT ON TABLE public.materials_purchases TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE material_purchases_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO anon;

GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.material_purchases_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.material_purchases_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.material_purchases_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.material_purchases_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.materials_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.materials_id_seq TO anon;

GRANT ALL ON SEQUENCE public.materials_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.materials_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.materials_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.materials_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE materials_purchases_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO anon;

GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.materials_purchases_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.materials_purchases_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.materials_purchases_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.materials_purchases_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE n8n_chat_histories; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.n8n_chat_histories TO postgres;

GRANT ALL ON TABLE public.n8n_chat_histories TO anon;

GRANT ALL ON TABLE public.n8n_chat_histories TO authenticated;

GRANT ALL ON TABLE public.n8n_chat_histories TO service_role;

GRANT SELECT ON TABLE public.n8n_chat_histories TO "databasus-e163795d";

GRANT SELECT ON TABLE public.n8n_chat_histories TO "databasus-93da8106";

GRANT SELECT ON TABLE public.n8n_chat_histories TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE n8n_chat_histories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO anon;

GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.n8n_chat_histories_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_followers TO postgres;

GRANT ALL ON TABLE public.orders_followers TO anon;

GRANT ALL ON TABLE public.orders_followers TO authenticated;

GRANT ALL ON TABLE public.orders_followers TO service_role;

GRANT SELECT ON TABLE public.orders_followers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_followers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_followers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_followers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_followers_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_followers_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_followers_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_followers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_statuses_logs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_statuses_logs TO postgres;

GRANT ALL ON TABLE public.orders_statuses_logs TO anon;

GRANT ALL ON TABLE public.orders_statuses_logs TO authenticated;

GRANT ALL ON TABLE public.orders_statuses_logs TO service_role;

GRANT SELECT ON TABLE public.orders_statuses_logs TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_statuses_logs TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_statuses_logs TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_statuses_logs_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_statuses_logs_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_statuses_logs_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_statuses_logs_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_statuses_logs_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits TO postgres;

GRANT ALL ON TABLE public.orders_visits TO anon;

GRANT ALL ON TABLE public.orders_visits TO authenticated;

GRANT ALL ON TABLE public.orders_visits TO service_role;

GRANT SELECT ON TABLE public.orders_visits TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_assets TO postgres;

GRANT ALL ON TABLE public.orders_visits_assets TO anon;

GRANT ALL ON TABLE public.orders_visits_assets TO authenticated;

GRANT ALL ON TABLE public.orders_visits_assets TO service_role;

GRANT SELECT ON TABLE public.orders_visits_assets TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_assets TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_assets_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_assets_activities TO postgres;

GRANT ALL ON TABLE public.orders_visits_assets_activities TO anon;

GRANT ALL ON TABLE public.orders_visits_assets_activities TO authenticated;

GRANT ALL ON TABLE public.orders_visits_assets_activities TO service_role;

GRANT SELECT ON TABLE public.orders_visits_assets_activities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_assets_activities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_assets_activities TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_assets_activities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_assets_activities_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_assets_activities_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_assets_activities_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_assets_activities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_assets_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_assets_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_assets_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_assets_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_assets_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_assets_materials TO postgres;

GRANT ALL ON TABLE public.orders_visits_assets_materials TO anon;

GRANT ALL ON TABLE public.orders_visits_assets_materials TO authenticated;

GRANT ALL ON TABLE public.orders_visits_assets_materials TO service_role;

GRANT SELECT ON TABLE public.orders_visits_assets_materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_assets_materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_assets_materials TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_assets_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_assets_materials_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_assets_materials_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_assets_materials_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_assets_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_chat; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_chat TO postgres;

GRANT ALL ON TABLE public.orders_visits_chat TO anon;

GRANT ALL ON TABLE public.orders_visits_chat TO authenticated;

GRANT ALL ON TABLE public.orders_visits_chat TO service_role;

GRANT SELECT ON TABLE public.orders_visits_chat TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_chat TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_chat TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_chat_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_chat_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_chat_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_chat_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_chat_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_chat_participants; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_chat_participants TO postgres;

GRANT ALL ON TABLE public.orders_visits_chat_participants TO anon;

GRANT ALL ON TABLE public.orders_visits_chat_participants TO authenticated;

GRANT ALL ON TABLE public.orders_visits_chat_participants TO service_role;

GRANT SELECT ON TABLE public.orders_visits_chat_participants TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_chat_participants TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_chat_participants TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_chat_participants_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_chat_participants_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_chat_participants_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_chat_participants_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_chat_participants_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_chat_reads; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_chat_reads TO postgres;

GRANT ALL ON TABLE public.orders_visits_chat_reads TO anon;

GRANT ALL ON TABLE public.orders_visits_chat_reads TO authenticated;

GRANT ALL ON TABLE public.orders_visits_chat_reads TO service_role;

GRANT SELECT ON TABLE public.orders_visits_chat_reads TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_chat_reads TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_chat_reads TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_chat_reads_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_chat_reads_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_chat_reads_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_chat_reads_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_chat_reads_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_evaluations; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_evaluations TO postgres;

GRANT ALL ON TABLE public.orders_visits_evaluations TO anon;

GRANT ALL ON TABLE public.orders_visits_evaluations TO authenticated;

GRANT ALL ON TABLE public.orders_visits_evaluations TO service_role;

GRANT SELECT ON TABLE public.orders_visits_evaluations TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_evaluations TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_evaluations TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_evaluations_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_evaluations_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_evaluations_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_evaluations_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_evaluations_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_extras_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_extras_followers TO postgres;

GRANT ALL ON TABLE public.orders_visits_extras_followers TO anon;

GRANT ALL ON TABLE public.orders_visits_extras_followers TO authenticated;

GRANT ALL ON TABLE public.orders_visits_extras_followers TO service_role;

GRANT SELECT ON TABLE public.orders_visits_extras_followers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_extras_followers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_extras_followers TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_extras_followers_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_extras_followers_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_extras_followers_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_extras_followers_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_extras_followers_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_extras_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_extras_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_extras_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_extras_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_extras_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_extras_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_extras_teams TO postgres;

GRANT ALL ON TABLE public.orders_visits_extras_teams TO anon;

GRANT ALL ON TABLE public.orders_visits_extras_teams TO authenticated;

GRANT ALL ON TABLE public.orders_visits_extras_teams TO service_role;

GRANT SELECT ON TABLE public.orders_visits_extras_teams TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_extras_teams TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_extras_teams TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_extras_teams_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_extras_teams_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_extras_teams_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_extras_teams_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_extras_teams_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_services TO postgres;

GRANT ALL ON TABLE public.orders_visits_services TO anon;

GRANT ALL ON TABLE public.orders_visits_services TO authenticated;

GRANT ALL ON TABLE public.orders_visits_services TO service_role;

GRANT SELECT ON TABLE public.orders_visits_services TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_services TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_services TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_services_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_services_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_services_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_services_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_services_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_teams TO postgres;

GRANT ALL ON TABLE public.orders_visits_teams TO anon;

GRANT ALL ON TABLE public.orders_visits_teams TO authenticated;

GRANT ALL ON TABLE public.orders_visits_teams TO service_role;

GRANT SELECT ON TABLE public.orders_visits_teams TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_teams TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_teams TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_teams_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_teams_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_teams_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_teams_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_teams_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE orders_visits_vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.orders_visits_vehicles TO postgres;

GRANT ALL ON TABLE public.orders_visits_vehicles TO anon;

GRANT ALL ON TABLE public.orders_visits_vehicles TO authenticated;

GRANT ALL ON TABLE public.orders_visits_vehicles TO service_role;

GRANT SELECT ON TABLE public.orders_visits_vehicles TO "databasus-e163795d";

GRANT SELECT ON TABLE public.orders_visits_vehicles TO "databasus-93da8106";

GRANT SELECT ON TABLE public.orders_visits_vehicles TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE orders_visits_vehicles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO anon;

GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.orders_visits_vehicles_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.orders_visits_vehicles_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.orders_visits_vehicles_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.orders_visits_vehicles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.schema_migrations TO postgres;

GRANT ALL ON TABLE public.schema_migrations TO anon;

GRANT ALL ON TABLE public.schema_migrations TO authenticated;

GRANT ALL ON TABLE public.schema_migrations TO service_role;

GRANT SELECT ON TABLE public.schema_migrations TO "databasus-e163795d";

GRANT SELECT ON TABLE public.schema_migrations TO "databasus-93da8106";

GRANT SELECT ON TABLE public.schema_migrations TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE system_notice_categories_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO anon;

GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.system_notice_categories_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.system_notice_categories_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.system_notice_categories_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.system_notice_categories_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE system_notice_severities_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO anon;

GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.system_notice_severities_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.system_notice_severities_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.system_notice_severities_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.system_notice_severities_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE system_notices_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.system_notices_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.system_notices_id_seq TO anon;

GRANT ALL ON SEQUENCE public.system_notices_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.system_notices_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.system_notices_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.system_notices_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.system_notices_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE technicals_manuals_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.technicals_manuals_assets TO postgres;

GRANT ALL ON TABLE public.technicals_manuals_assets TO anon;

GRANT ALL ON TABLE public.technicals_manuals_assets TO authenticated;

GRANT ALL ON TABLE public.technicals_manuals_assets TO service_role;

GRANT SELECT ON TABLE public.technicals_manuals_assets TO "databasus-e163795d";

GRANT SELECT ON TABLE public.technicals_manuals_assets TO "databasus-93da8106";

GRANT SELECT ON TABLE public.technicals_manuals_assets TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE technicals_manuals_assets_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO anon;

GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.technicals_manuals_assets_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.technicals_manuals_assets_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.technicals_manuals_assets_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.technicals_manuals_assets_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE technicals_manuals_files_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO anon;

GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.technicals_manuals_files_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.technicals_manuals_files_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.technicals_manuals_files_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.technicals_manuals_files_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE technicals_manuals_files; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.technicals_manuals_files TO postgres;

GRANT ALL ON TABLE public.technicals_manuals_files TO anon;

GRANT ALL ON TABLE public.technicals_manuals_files TO authenticated;

GRANT ALL ON TABLE public.technicals_manuals_files TO service_role;

GRANT SELECT ON TABLE public.technicals_manuals_files TO "databasus-e163795d";

GRANT SELECT ON TABLE public.technicals_manuals_files TO "databasus-93da8106";

GRANT SELECT ON TABLE public.technicals_manuals_files TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE technicals_manuals_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO anon;

GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.technicals_manuals_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.technicals_manuals_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.technicals_manuals_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.technicals_manuals_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE tenants; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.tenants TO postgres;

GRANT ALL ON TABLE public.tenants TO anon;

GRANT ALL ON TABLE public.tenants TO authenticated;

GRANT ALL ON TABLE public.tenants TO service_role;

GRANT SELECT ON TABLE public.tenants TO "databasus-e163795d";

GRANT SELECT ON TABLE public.tenants TO "databasus-93da8106";

GRANT SELECT ON TABLE public.tenants TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE tmp_contracts_import_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO anon;

GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.tmp_contracts_import_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.tmp_contracts_import_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.tmp_contracts_import_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.tmp_contracts_import_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE tools; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.tools TO postgres;

GRANT ALL ON TABLE public.tools TO anon;

GRANT ALL ON TABLE public.tools TO authenticated;

GRANT ALL ON TABLE public.tools TO service_role;

GRANT SELECT ON TABLE public.tools TO "databasus-e163795d";

GRANT SELECT ON TABLE public.tools TO "databasus-93da8106";

GRANT SELECT ON TABLE public.tools TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE tools_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.tools_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.tools_id_seq TO anon;

GRANT ALL ON SEQUENCE public.tools_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.tools_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.tools_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.tools_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.tools_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE units_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.units_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.units_id_seq TO anon;

GRANT ALL ON SEQUENCE public.units_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.units_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.units_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.units_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.units_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.users_id_seq TO anon;

GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.users_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.users_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.users_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_notifications; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_notifications TO postgres;

GRANT ALL ON TABLE public.users_notifications TO anon;

GRANT ALL ON TABLE public.users_notifications TO authenticated;

GRANT ALL ON TABLE public.users_notifications TO service_role;

GRANT SELECT ON TABLE public.users_notifications TO "databasus-e163795d";

GRANT SELECT ON TABLE public.users_notifications TO "databasus-93da8106";

GRANT SELECT ON TABLE public.users_notifications TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_notifications_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO anon;

GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.users_notifications_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.users_notifications_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.users_notifications_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.users_notifications_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_tools; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_tools TO postgres;

GRANT ALL ON TABLE public.users_tools TO anon;

GRANT ALL ON TABLE public.users_tools TO authenticated;

GRANT ALL ON TABLE public.users_tools TO service_role;

GRANT SELECT ON TABLE public.users_tools TO "databasus-e163795d";

GRANT SELECT ON TABLE public.users_tools TO "databasus-93da8106";

GRANT SELECT ON TABLE public.users_tools TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_tools_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_tools_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.users_tools_id_seq TO anon;

GRANT ALL ON SEQUENCE public.users_tools_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.users_tools_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.users_tools_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.users_tools_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.users_tools_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_tools_movements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_tools_movements TO postgres;

GRANT ALL ON TABLE public.users_tools_movements TO anon;

GRANT ALL ON TABLE public.users_tools_movements TO authenticated;

GRANT ALL ON TABLE public.users_tools_movements TO service_role;

GRANT SELECT ON TABLE public.users_tools_movements TO "databasus-e163795d";

GRANT SELECT ON TABLE public.users_tools_movements TO "databasus-93da8106";

GRANT SELECT ON TABLE public.users_tools_movements TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_tools_movements_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO anon;

GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.users_tools_movements_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.users_tools_movements_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.users_tools_movements_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.users_tools_movements_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE users_tracker; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.users_tracker TO postgres;

GRANT ALL ON TABLE public.users_tracker TO anon;

GRANT ALL ON TABLE public.users_tracker TO authenticated;

GRANT ALL ON TABLE public.users_tracker TO service_role;

GRANT SELECT ON TABLE public.users_tracker TO "databasus-e163795d";

GRANT SELECT ON TABLE public.users_tracker TO "databasus-93da8106";

GRANT SELECT ON TABLE public.users_tracker TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE users_tracker_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO anon;

GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.users_tracker_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.users_tracker_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.users_tracker_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.users_tracker_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app TO postgres;

GRANT ALL ON TABLE public.v_app TO anon;

GRANT ALL ON TABLE public.v_app TO authenticated;

GRANT ALL ON TABLE public.v_app TO service_role;

GRANT SELECT ON TABLE public.v_app TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_app TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_app TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app_notices; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app_notices TO postgres;

GRANT ALL ON TABLE public.v_app_notices TO anon;

GRANT ALL ON TABLE public.v_app_notices TO authenticated;

GRANT ALL ON TABLE public.v_app_notices TO service_role;

GRANT SELECT ON TABLE public.v_app_notices TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_app_notices TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_app_notices TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app_offline_updates; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app_offline_updates TO postgres;

GRANT ALL ON TABLE public.v_app_offline_updates TO anon;

GRANT ALL ON TABLE public.v_app_offline_updates TO authenticated;

GRANT ALL ON TABLE public.v_app_offline_updates TO service_role;

GRANT SELECT ON TABLE public.v_app_offline_updates TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_app_offline_updates TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_app_offline_updates TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_app_pages; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_app_pages TO postgres;

GRANT ALL ON TABLE public.v_app_pages TO anon;

GRANT ALL ON TABLE public.v_app_pages TO authenticated;

GRANT ALL ON TABLE public.v_app_pages TO service_role;

GRANT SELECT ON TABLE public.v_app_pages TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_app_pages TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_app_pages TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_available; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_available TO postgres;

GRANT ALL ON TABLE public.v_assets_available TO anon;

GRANT ALL ON TABLE public.v_assets_available TO authenticated;

GRANT ALL ON TABLE public.v_assets_available TO service_role;

GRANT SELECT ON TABLE public.v_assets_available TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_available TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_available TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_couplings_models; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_couplings_models TO postgres;

GRANT ALL ON TABLE public.v_assets_couplings_models TO anon;

GRANT ALL ON TABLE public.v_assets_couplings_models TO authenticated;

GRANT ALL ON TABLE public.v_assets_couplings_models TO service_role;

GRANT SELECT ON TABLE public.v_assets_couplings_models TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_couplings_models TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_couplings_models TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_followers TO postgres;

GRANT ALL ON TABLE public.v_assets_followers TO anon;

GRANT ALL ON TABLE public.v_assets_followers TO authenticated;

GRANT ALL ON TABLE public.v_assets_followers TO service_role;

GRANT SELECT ON TABLE public.v_assets_followers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_followers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_followers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_loans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_loans TO postgres;

GRANT ALL ON TABLE public.v_assets_loans TO anon;

GRANT ALL ON TABLE public.v_assets_loans TO authenticated;

GRANT ALL ON TABLE public.v_assets_loans TO service_role;

GRANT SELECT ON TABLE public.v_assets_loans TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_loans TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_loans TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_materials TO postgres;

GRANT ALL ON TABLE public.v_assets_materials TO anon;

GRANT ALL ON TABLE public.v_assets_materials TO authenticated;

GRANT ALL ON TABLE public.v_assets_materials TO service_role;

GRANT SELECT ON TABLE public.v_assets_materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_priorities TO postgres;

GRANT ALL ON TABLE public.v_assets_priorities TO anon;

GRANT ALL ON TABLE public.v_assets_priorities TO authenticated;

GRANT ALL ON TABLE public.v_assets_priorities TO service_role;

GRANT SELECT ON TABLE public.v_assets_priorities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_priorities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_statuses TO postgres;

GRANT ALL ON TABLE public.v_assets_statuses TO anon;

GRANT ALL ON TABLE public.v_assets_statuses TO authenticated;

GRANT ALL ON TABLE public.v_assets_statuses TO service_role;

GRANT SELECT ON TABLE public.v_assets_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_tags; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_tags TO postgres;

GRANT ALL ON TABLE public.v_assets_tags TO anon;

GRANT ALL ON TABLE public.v_assets_tags TO authenticated;

GRANT ALL ON TABLE public.v_assets_tags TO service_role;

GRANT SELECT ON TABLE public.v_assets_tags TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_tags TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_tags TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_tags_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_tags_subs TO postgres;

GRANT ALL ON TABLE public.v_assets_tags_subs TO anon;

GRANT ALL ON TABLE public.v_assets_tags_subs TO authenticated;

GRANT ALL ON TABLE public.v_assets_tags_subs TO service_role;

GRANT SELECT ON TABLE public.v_assets_tags_subs TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_tags_subs TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_tags_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_types TO postgres;

GRANT ALL ON TABLE public.v_assets_types TO anon;

GRANT ALL ON TABLE public.v_assets_types TO authenticated;

GRANT ALL ON TABLE public.v_assets_types TO service_role;

GRANT SELECT ON TABLE public.v_assets_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_assets_unavailable_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO postgres;

GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO anon;

GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO authenticated;

GRANT ALL ON TABLE public.v_assets_unavailable_reasons TO service_role;

GRANT SELECT ON TABLE public.v_assets_unavailable_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_assets_unavailable_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_assets_unavailable_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_companies; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_companies TO postgres;

GRANT ALL ON TABLE public.v_companies TO anon;

GRANT ALL ON TABLE public.v_companies TO authenticated;

GRANT ALL ON TABLE public.v_companies TO service_role;

GRANT SELECT ON TABLE public.v_companies TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_companies TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_companies TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts TO postgres;

GRANT ALL ON TABLE public.v_contracts TO anon;

GRANT ALL ON TABLE public.v_contracts TO authenticated;

GRANT ALL ON TABLE public.v_contracts TO service_role;

GRANT SELECT ON TABLE public.v_contracts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_contracts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts_evaluation_requirements; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO postgres;

GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO anon;

GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO authenticated;

GRANT ALL ON TABLE public.v_contracts_evaluation_requirements TO service_role;

GRANT SELECT ON TABLE public.v_contracts_evaluation_requirements TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_contracts_evaluation_requirements TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_contracts_evaluation_requirements TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_contracts_managers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_contracts_managers TO postgres;

GRANT ALL ON TABLE public.v_contracts_managers TO anon;

GRANT ALL ON TABLE public.v_contracts_managers TO authenticated;

GRANT ALL ON TABLE public.v_contracts_managers TO service_role;

GRANT SELECT ON TABLE public.v_contracts_managers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_contracts_managers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_contracts_managers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_dash_admin_orders_parent_status_1; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO postgres;

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO anon;

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO authenticated;

GRANT ALL ON TABLE public.v_dash_admin_orders_parent_status_1 TO service_role;

GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_status_1 TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_status_1 TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_dash_admin_orders_parent_status_1 TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_departments; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_departments TO postgres;

GRANT ALL ON TABLE public.v_departments TO anon;

GRANT ALL ON TABLE public.v_departments TO authenticated;

GRANT ALL ON TABLE public.v_departments TO service_role;

GRANT SELECT ON TABLE public.v_departments TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_departments TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_departments TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_import_orders_visits_contracts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO postgres;

GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO anon;

GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO authenticated;

GRANT ALL ON TABLE public.v_import_orders_visits_contracts TO service_role;

GRANT SELECT ON TABLE public.v_import_orders_visits_contracts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_import_orders_visits_contracts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_import_orders_visits_contracts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_leader_ranking; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_leader_ranking TO postgres;

GRANT ALL ON TABLE public.v_leader_ranking TO anon;

GRANT ALL ON TABLE public.v_leader_ranking TO authenticated;

GRANT ALL ON TABLE public.v_leader_ranking TO service_role;

GRANT SELECT ON TABLE public.v_leader_ranking TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_leader_ranking TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_leader_ranking TO "databasus-3a3c9dfb";


--
-- Name: TABLE warehouses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.warehouses TO postgres;

GRANT ALL ON TABLE public.warehouses TO anon;

GRANT ALL ON TABLE public.warehouses TO authenticated;

GRANT ALL ON TABLE public.warehouses TO service_role;

GRANT SELECT ON TABLE public.warehouses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.warehouses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.warehouses TO "databasus-3a3c9dfb";


--
-- Name: TABLE warehouses_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.warehouses_materials TO postgres;

GRANT ALL ON TABLE public.warehouses_materials TO anon;

GRANT ALL ON TABLE public.warehouses_materials TO authenticated;

GRANT ALL ON TABLE public.warehouses_materials TO service_role;

GRANT SELECT ON TABLE public.warehouses_materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.warehouses_materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.warehouses_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_materials TO postgres;

GRANT ALL ON TABLE public.v_materials TO anon;

GRANT ALL ON TABLE public.v_materials TO authenticated;

GRANT ALL ON TABLE public.v_materials TO service_role;

GRANT SELECT ON TABLE public.v_materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_materials_purchases; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_materials_purchases TO postgres;

GRANT ALL ON TABLE public.v_materials_purchases TO anon;

GRANT ALL ON TABLE public.v_materials_purchases TO authenticated;

GRANT ALL ON TABLE public.v_materials_purchases TO service_role;

GRANT SELECT ON TABLE public.v_materials_purchases TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_materials_purchases TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_materials_purchases TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_order_visit_scores; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_order_visit_scores TO postgres;

GRANT ALL ON TABLE public.v_order_visit_scores TO anon;

GRANT ALL ON TABLE public.v_order_visit_scores TO authenticated;

GRANT ALL ON TABLE public.v_order_visit_scores TO service_role;

GRANT SELECT ON TABLE public.v_order_visit_scores TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_order_visit_scores TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_order_visit_scores TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_cancel_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_cancel_reasons TO postgres;

GRANT ALL ON TABLE public.v_orders_cancel_reasons TO anon;

GRANT ALL ON TABLE public.v_orders_cancel_reasons TO authenticated;

GRANT ALL ON TABLE public.v_orders_cancel_reasons TO service_role;

GRANT SELECT ON TABLE public.v_orders_cancel_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_cancel_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_cancel_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_causes_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_causes_reasons TO postgres;

GRANT ALL ON TABLE public.v_orders_causes_reasons TO anon;

GRANT ALL ON TABLE public.v_orders_causes_reasons TO authenticated;

GRANT ALL ON TABLE public.v_orders_causes_reasons TO service_role;

GRANT SELECT ON TABLE public.v_orders_causes_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_causes_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_causes_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_counter; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_counter TO postgres;

GRANT ALL ON TABLE public.v_orders_counter TO anon;

GRANT ALL ON TABLE public.v_orders_counter TO authenticated;

GRANT ALL ON TABLE public.v_orders_counter TO service_role;

GRANT SELECT ON TABLE public.v_orders_counter TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_counter TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_counter TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_followers TO postgres;

GRANT ALL ON TABLE public.v_orders_followers TO anon;

GRANT ALL ON TABLE public.v_orders_followers TO authenticated;

GRANT ALL ON TABLE public.v_orders_followers TO service_role;

GRANT SELECT ON TABLE public.v_orders_followers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_followers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_followers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_objects; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_objects TO postgres;

GRANT ALL ON TABLE public.v_orders_objects TO anon;

GRANT ALL ON TABLE public.v_orders_objects TO authenticated;

GRANT ALL ON TABLE public.v_orders_objects TO service_role;

GRANT SELECT ON TABLE public.v_orders_objects TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_objects TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_objects TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_open; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_open TO postgres;

GRANT ALL ON TABLE public.v_orders_open TO anon;

GRANT ALL ON TABLE public.v_orders_open TO authenticated;

GRANT ALL ON TABLE public.v_orders_open TO service_role;

GRANT SELECT ON TABLE public.v_orders_open TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_open TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_open TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_parent; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_parent TO postgres;

GRANT ALL ON TABLE public.v_orders_parent TO anon;

GRANT ALL ON TABLE public.v_orders_parent TO authenticated;

GRANT ALL ON TABLE public.v_orders_parent TO service_role;

GRANT SELECT ON TABLE public.v_orders_parent TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_parent TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_parent TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_plans; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_plans TO postgres;

GRANT ALL ON TABLE public.v_orders_plans TO anon;

GRANT ALL ON TABLE public.v_orders_plans TO authenticated;

GRANT ALL ON TABLE public.v_orders_plans TO service_role;

GRANT SELECT ON TABLE public.v_orders_plans TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_plans TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_plans TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_priorities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_priorities TO postgres;

GRANT ALL ON TABLE public.v_orders_priorities TO anon;

GRANT ALL ON TABLE public.v_orders_priorities TO authenticated;

GRANT ALL ON TABLE public.v_orders_priorities TO service_role;

GRANT SELECT ON TABLE public.v_orders_priorities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_priorities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_priorities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_statuses TO postgres;

GRANT ALL ON TABLE public.v_orders_statuses TO anon;

GRANT ALL ON TABLE public.v_orders_statuses TO authenticated;

GRANT ALL ON TABLE public.v_orders_statuses TO service_role;

GRANT SELECT ON TABLE public.v_orders_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_suspended_reasons; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_suspended_reasons TO postgres;

GRANT ALL ON TABLE public.v_orders_suspended_reasons TO anon;

GRANT ALL ON TABLE public.v_orders_suspended_reasons TO authenticated;

GRANT ALL ON TABLE public.v_orders_suspended_reasons TO service_role;

GRANT SELECT ON TABLE public.v_orders_suspended_reasons TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_suspended_reasons TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_suspended_reasons TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_types TO postgres;

GRANT ALL ON TABLE public.v_orders_types TO anon;

GRANT ALL ON TABLE public.v_orders_types TO authenticated;

GRANT ALL ON TABLE public.v_orders_types TO service_role;

GRANT SELECT ON TABLE public.v_orders_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_types_subs; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_types_subs TO postgres;

GRANT ALL ON TABLE public.v_orders_types_subs TO anon;

GRANT ALL ON TABLE public.v_orders_types_subs TO authenticated;

GRANT ALL ON TABLE public.v_orders_types_subs TO service_role;

GRANT SELECT ON TABLE public.v_orders_types_subs TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_types_subs TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_types_subs TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits TO postgres;

GRANT ALL ON TABLE public.v_orders_visits TO anon;

GRANT ALL ON TABLE public.v_orders_visits TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_assets TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_assets TO anon;

GRANT ALL ON TABLE public.v_orders_visits_assets TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_assets TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_assets TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_assets TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_assets_activities; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO anon;

GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_assets_activities TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_assets_activities TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_assets_activities TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_assets_activities TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_assets_materials; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO anon;

GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_assets_materials TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_assets_materials TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_assets_materials TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_assets_materials TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_evaluations; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_evaluations TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_evaluations TO anon;

GRANT ALL ON TABLE public.v_orders_visits_evaluations TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_evaluations TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_evaluations TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_evaluations TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_evaluations TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_extras_followers; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO anon;

GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_extras_followers TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_extras_followers TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_extras_followers TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_extras_followers TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_extras_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO anon;

GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_extras_teams TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_extras_teams TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_extras_teams TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_extras_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_services TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_services TO anon;

GRANT ALL ON TABLE public.v_orders_visits_services TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_services TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_services TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_services TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_teams TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_teams TO anon;

GRANT ALL ON TABLE public.v_orders_visits_teams TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_teams TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_teams TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_teams TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.vehicles TO postgres;

GRANT ALL ON TABLE public.vehicles TO anon;

GRANT ALL ON TABLE public.vehicles TO authenticated;

GRANT ALL ON TABLE public.vehicles TO service_role;

GRANT SELECT ON TABLE public.vehicles TO "databasus-e163795d";

GRANT SELECT ON TABLE public.vehicles TO "databasus-93da8106";

GRANT SELECT ON TABLE public.vehicles TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_orders_visits_vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_orders_visits_vehicles TO postgres;

GRANT ALL ON TABLE public.v_orders_visits_vehicles TO anon;

GRANT ALL ON TABLE public.v_orders_visits_vehicles TO authenticated;

GRANT ALL ON TABLE public.v_orders_visits_vehicles TO service_role;

GRANT SELECT ON TABLE public.v_orders_visits_vehicles TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_orders_visits_vehicles TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_orders_visits_vehicles TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_profiles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_profiles TO postgres;

GRANT ALL ON TABLE public.v_profiles TO anon;

GRANT ALL ON TABLE public.v_profiles TO authenticated;

GRANT ALL ON TABLE public.v_profiles TO service_role;

GRANT SELECT ON TABLE public.v_profiles TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_profiles TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_profiles TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_profiles_permissions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_profiles_permissions TO postgres;

GRANT ALL ON TABLE public.v_profiles_permissions TO anon;

GRANT ALL ON TABLE public.v_profiles_permissions TO authenticated;

GRANT ALL ON TABLE public.v_profiles_permissions TO service_role;

GRANT SELECT ON TABLE public.v_profiles_permissions TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_profiles_permissions TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_profiles_permissions TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_services; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_services TO postgres;

GRANT ALL ON TABLE public.v_services TO anon;

GRANT ALL ON TABLE public.v_services TO authenticated;

GRANT ALL ON TABLE public.v_services TO service_role;

GRANT SELECT ON TABLE public.v_services TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_services TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_services TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems TO postgres;

GRANT ALL ON TABLE public.v_systems TO anon;

GRANT ALL ON TABLE public.v_systems TO authenticated;

GRANT ALL ON TABLE public.v_systems TO service_role;

GRANT SELECT ON TABLE public.v_systems TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_systems TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_systems TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems_parent; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems_parent TO postgres;

GRANT ALL ON TABLE public.v_systems_parent TO anon;

GRANT ALL ON TABLE public.v_systems_parent TO authenticated;

GRANT ALL ON TABLE public.v_systems_parent TO service_role;

GRANT SELECT ON TABLE public.v_systems_parent TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_systems_parent TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_systems_parent TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems_parent_assets_tags_available_rate; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO postgres;

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO anon;

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO authenticated;

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_available_rate TO service_role;

GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_available_rate TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_available_rate TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_available_rate TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_systems_parent_assets_tags_processing_counts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO postgres;

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO anon;

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO authenticated;

GRANT ALL ON TABLE public.v_systems_parent_assets_tags_processing_counts TO service_role;

GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_processing_counts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_processing_counts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_systems_parent_assets_tags_processing_counts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_teams; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_teams TO postgres;

GRANT ALL ON TABLE public.v_teams TO anon;

GRANT ALL ON TABLE public.v_teams TO authenticated;

GRANT ALL ON TABLE public.v_teams TO service_role;

GRANT SELECT ON TABLE public.v_teams TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_teams TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_teams TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_users; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_users TO postgres;

GRANT ALL ON TABLE public.v_users TO anon;

GRANT ALL ON TABLE public.v_users TO authenticated;

GRANT ALL ON TABLE public.v_users TO service_role;

GRANT SELECT ON TABLE public.v_users TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_users TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_users TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_teams_leaders; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_teams_leaders TO postgres;

GRANT ALL ON TABLE public.v_teams_leaders TO anon;

GRANT ALL ON TABLE public.v_teams_leaders TO authenticated;

GRANT ALL ON TABLE public.v_teams_leaders TO service_role;

GRANT SELECT ON TABLE public.v_teams_leaders TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_teams_leaders TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_teams_leaders TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_technicals_manuals_assets; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_technicals_manuals_assets TO postgres;

GRANT ALL ON TABLE public.v_technicals_manuals_assets TO anon;

GRANT ALL ON TABLE public.v_technicals_manuals_assets TO authenticated;

GRANT ALL ON TABLE public.v_technicals_manuals_assets TO service_role;

GRANT SELECT ON TABLE public.v_technicals_manuals_assets TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_technicals_manuals_assets TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_technicals_manuals_assets TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_technicals_manuals_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_technicals_manuals_types TO postgres;

GRANT ALL ON TABLE public.v_technicals_manuals_types TO anon;

GRANT ALL ON TABLE public.v_technicals_manuals_types TO authenticated;

GRANT ALL ON TABLE public.v_technicals_manuals_types TO service_role;

GRANT SELECT ON TABLE public.v_technicals_manuals_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_technicals_manuals_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_technicals_manuals_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_unit_assets_tags_processing_counts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO postgres;

GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO anon;

GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO authenticated;

GRANT ALL ON TABLE public.v_unit_assets_tags_processing_counts TO service_role;

GRANT SELECT ON TABLE public.v_unit_assets_tags_processing_counts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_unit_assets_tags_processing_counts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_unit_assets_tags_processing_counts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_asset_available_rate_avg; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO postgres;

GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO anon;

GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO authenticated;

GRANT ALL ON TABLE public.v_units_asset_available_rate_avg TO service_role;

GRANT SELECT ON TABLE public.v_units_asset_available_rate_avg TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_asset_available_rate_avg TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_asset_available_rate_avg TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_availability; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_availability TO postgres;

GRANT ALL ON TABLE public.v_units_assets_tags_availability TO anon;

GRANT ALL ON TABLE public.v_units_assets_tags_availability TO authenticated;

GRANT ALL ON TABLE public.v_units_assets_tags_availability TO service_role;

GRANT SELECT ON TABLE public.v_units_assets_tags_availability TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_assets_tags_availability TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_assets_tags_availability TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_available_rate; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO postgres;

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO anon;

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO authenticated;

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate TO service_role;

GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_available_rate_latest_by_user; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO postgres;

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO anon;

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO authenticated;

GRANT ALL ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO service_role;

GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_assets_tags_available_rate_latest_by_user TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_assets_tags_processing_counts; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO postgres;

GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO anon;

GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO authenticated;

GRANT ALL ON TABLE public.v_units_assets_tags_processing_counts TO service_role;

GRANT SELECT ON TABLE public.v_units_assets_tags_processing_counts TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_assets_tags_processing_counts TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_assets_tags_processing_counts TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_statuses; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_statuses TO postgres;

GRANT ALL ON TABLE public.v_units_statuses TO anon;

GRANT ALL ON TABLE public.v_units_statuses TO authenticated;

GRANT ALL ON TABLE public.v_units_statuses TO service_role;

GRANT SELECT ON TABLE public.v_units_statuses TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_statuses TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_statuses TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_types; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_types TO postgres;

GRANT ALL ON TABLE public.v_units_types TO anon;

GRANT ALL ON TABLE public.v_units_types TO authenticated;

GRANT ALL ON TABLE public.v_units_types TO service_role;

GRANT SELECT ON TABLE public.v_units_types TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_types TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_types TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_units_types_parent; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_units_types_parent TO postgres;

GRANT ALL ON TABLE public.v_units_types_parent TO anon;

GRANT ALL ON TABLE public.v_units_types_parent TO authenticated;

GRANT ALL ON TABLE public.v_units_types_parent TO service_role;

GRANT SELECT ON TABLE public.v_units_types_parent TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_units_types_parent TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_units_types_parent TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_users_notifications; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_users_notifications TO postgres;

GRANT ALL ON TABLE public.v_users_notifications TO anon;

GRANT ALL ON TABLE public.v_users_notifications TO authenticated;

GRANT ALL ON TABLE public.v_users_notifications TO service_role;

GRANT SELECT ON TABLE public.v_users_notifications TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_users_notifications TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_users_notifications TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_users_permissions; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_users_permissions TO postgres;

GRANT ALL ON TABLE public.v_users_permissions TO anon;

GRANT ALL ON TABLE public.v_users_permissions TO authenticated;

GRANT ALL ON TABLE public.v_users_permissions TO service_role;

GRANT SELECT ON TABLE public.v_users_permissions TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_users_permissions TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_users_permissions TO "databasus-3a3c9dfb";


--
-- Name: TABLE v_vehicles; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE public.v_vehicles TO postgres;

GRANT ALL ON TABLE public.v_vehicles TO anon;

GRANT ALL ON TABLE public.v_vehicles TO authenticated;

GRANT ALL ON TABLE public.v_vehicles TO service_role;

GRANT SELECT ON TABLE public.v_vehicles TO "databasus-e163795d";

GRANT SELECT ON TABLE public.v_vehicles TO "databasus-93da8106";

GRANT SELECT ON TABLE public.v_vehicles TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE vehicles_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.vehicles_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.vehicles_id_seq TO anon;

GRANT ALL ON SEQUENCE public.vehicles_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.vehicles_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.vehicles_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.vehicles_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.vehicles_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE warehouses_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.warehouses_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.warehouses_id_seq TO anon;

GRANT ALL ON SEQUENCE public.warehouses_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.warehouses_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.warehouses_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.warehouses_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.warehouses_id_seq TO "databasus-3a3c9dfb";


--
-- Name: SEQUENCE warehouses_materials_id_seq; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO postgres;

GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO anon;

GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.warehouses_materials_id_seq TO service_role;

GRANT SELECT ON SEQUENCE public.warehouses_materials_id_seq TO "databasus-e163795d";

GRANT SELECT ON SEQUENCE public.warehouses_materials_id_seq TO "databasus-93da8106";

GRANT SELECT ON SEQUENCE public.warehouses_materials_id_seq TO "databasus-3a3c9dfb";


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;

GRANT ALL ON TABLE storage.buckets TO authenticated;

GRANT ALL ON TABLE storage.buckets TO service_role;

GRANT ALL ON TABLE storage.buckets TO postgres;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;

GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;

GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;

GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;

GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE iceberg_namespaces; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.iceberg_namespaces TO service_role;

GRANT SELECT ON TABLE storage.iceberg_namespaces TO authenticated;

GRANT SELECT ON TABLE storage.iceberg_namespaces TO anon;


--
-- Name: TABLE iceberg_tables; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.iceberg_tables TO service_role;

GRANT SELECT ON TABLE storage.iceberg_tables TO authenticated;

GRANT SELECT ON TABLE storage.iceberg_tables TO anon;


--
-- Name: TABLE migrations; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.migrations TO anon;

GRANT ALL ON TABLE storage.migrations TO authenticated;

GRANT ALL ON TABLE storage.migrations TO service_role;

GRANT ALL ON TABLE storage.migrations TO postgres;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;

GRANT ALL ON TABLE storage.objects TO authenticated;

GRANT ALL ON TABLE storage.objects TO service_role;

GRANT ALL ON TABLE storage.objects TO postgres;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;

GRANT ALL ON TABLE storage.prefixes TO authenticated;

GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;

GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;

GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;

GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;

GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;

GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;

GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

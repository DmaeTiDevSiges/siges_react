CREATE POLICY "Admins can delete dismissals" ON public.cfg_app_tips_dismissals FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_companies Admins can delete tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tip companies" ON public.cfg_app_tips_companies FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_departments Admins can delete tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tip departments" ON public.cfg_app_tips_departments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_profiles Admins can delete tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tip profiles" ON public.cfg_app_tips_profiles FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips Admins can delete tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can delete tips" ON public.cfg_app_tips FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_companies Admins can insert tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tip companies" ON public.cfg_app_tips_companies FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_departments Admins can insert tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tip departments" ON public.cfg_app_tips_departments FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_profiles Admins can insert tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tip profiles" ON public.cfg_app_tips_profiles FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips Admins can insert tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can insert tips" ON public.cfg_app_tips FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_dismissals Admins can update dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update dismissals" ON public.cfg_app_tips_dismissals FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_companies Admins can update tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tip companies" ON public.cfg_app_tips_companies FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_departments Admins can update tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tip departments" ON public.cfg_app_tips_departments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips_profiles Admins can update tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tip profiles" ON public.cfg_app_tips_profiles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_tips Admins can update tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Admins can update tips" ON public.cfg_app_tips FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_evaluation_requirements Allow all authenticated delete cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated delete cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR DELETE TO authenticated USING (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated delete contracts_evaluation_requirement; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated delete contracts_evaluation_requirement" ON public.contracts_evaluation_requirements FOR DELETE TO authenticated USING (true);


--
-- Name: orders_visits_evaluations Allow all authenticated delete orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated delete orders_visits_evaluations" ON public.orders_visits_evaluations FOR DELETE TO authenticated USING (true);


--
-- Name: cfg_evaluation_requirements Allow all authenticated insert cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated insert cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated insert contracts_evaluation_requirement; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated insert contracts_evaluation_requirement" ON public.contracts_evaluation_requirements FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: orders_visits_evaluations Allow all authenticated insert orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated insert orders_visits_evaluations" ON public.orders_visits_evaluations FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cfg_materials_purchases_cancel_reasons Allow all authenticated read; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read" ON public.cfg_materials_purchases_cancel_reasons FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_evaluation_requirements Allow all authenticated read cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR SELECT TO authenticated USING (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated read contracts_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read contracts_evaluation_requirements" ON public.contracts_evaluation_requirements FOR SELECT TO authenticated USING (true);


--
-- Name: orders_visits_evaluations Allow all authenticated read orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated read orders_visits_evaluations" ON public.orders_visits_evaluations FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_evaluation_requirements Allow all authenticated update cfg_evaluation_requirements; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated update cfg_evaluation_requirements" ON public.cfg_evaluation_requirements FOR UPDATE TO authenticated USING (true);


--
-- Name: contracts_evaluation_requirements Allow all authenticated update contracts_evaluation_requirement; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated update contracts_evaluation_requirement" ON public.contracts_evaluation_requirements FOR UPDATE TO authenticated USING (true);


--
-- Name: orders_visits_evaluations Allow all authenticated update orders_visits_evaluations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Allow all authenticated update orders_visits_evaluations" ON public.orders_visits_evaluations FOR UPDATE TO authenticated USING (true);


--
-- Name: cfg_app_tips_companies Anyone can view tip companies; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Anyone can view tip companies" ON public.cfg_app_tips_companies FOR SELECT USING (true);


--
-- Name: cfg_app_tips_departments Anyone can view tip departments; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Anyone can view tip departments" ON public.cfg_app_tips_departments FOR SELECT USING (true);


--
-- Name: cfg_app_tips_profiles Anyone can view tip profiles; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Anyone can view tip profiles" ON public.cfg_app_tips_profiles FOR SELECT USING (true);


--
-- Name: goose_db_version Authenticated can read goose_db_version; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated can read goose_db_version" ON public.goose_db_version FOR SELECT TO authenticated USING (true);


--
-- Name: leader_monthly_scores Authenticated can read leader_monthly_scores; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read leader_monthly_scores" ON public.leader_monthly_scores FOR SELECT TO authenticated USING (true);


--
-- Name: leader_score_badges Authenticated can read leader_score_badges; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read leader_score_badges" ON public.leader_score_badges FOR SELECT TO authenticated USING (true);


--
-- Name: leader_scores_history Authenticated can read leader_scores_history; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read leader_scores_history" ON public.leader_scores_history FOR SELECT TO authenticated USING (true);


--
-- Name: schema_migrations Authenticated can read schema_migrations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Authenticated can read schema_migrations" ON public.schema_migrations FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_app_notices_categories Categories: view; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Categories: view" ON public.cfg_app_notices_categories FOR SELECT TO authenticated USING (true);


--
-- Name: cfg_app_tips_dismissals Insert dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Insert dismissals" ON public.cfg_app_tips_dismissals FOR INSERT WITH CHECK (((user_id = ( SELECT users.id
   FROM public.users
  WHERE (users.uuid = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: cfg_app_notices Notices: delete; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: delete" ON public.cfg_app_notices FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_notices Notices: insert; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: insert" ON public.cfg_app_notices FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_notices Notices: update; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: update" ON public.cfg_app_notices FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true)))));


--
-- Name: cfg_app_notices Notices: view; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Notices: view" ON public.cfg_app_notices FOR SELECT TO authenticated USING ((((is_active = true) AND (start_date <= (now() AT TIME ZONE 'America/Sao_Paulo'::text)) AND (end_date >= (now() AT TIME ZONE 'America/Sao_Paulo'::text))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: cfg_assets_attributes_groups Permissive; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Permissive" ON public.cfg_assets_attributes_groups USING (true);


--
-- Name: cfg_app_notices_severities Severities: view; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Severities: view" ON public.cfg_app_notices_severities FOR SELECT TO authenticated USING (true);


--
-- Name: ai_chat_histories Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_chat_histories USING (true) WITH CHECK (true);


--
-- Name: ai_chat_sessions Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_chat_sessions USING (true) WITH CHECK (true);


--
-- Name: ai_knowledge Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_knowledge USING (true) WITH CHECK (true);


--
-- Name: ai_messages Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.ai_messages USING (true) WITH CHECK (true);


--
-- Name: api_keys Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.api_keys USING (true) WITH CHECK (true);


--
-- Name: assets Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets USING (true) WITH CHECK (true);


--
-- Name: assets_alerts Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_alerts USING (true) WITH CHECK (true);


--
-- Name: assets_attributes_values Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_attributes_values USING (true) WITH CHECK (true);


--
-- Name: assets_available Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_available USING (true) WITH CHECK (true);


--
-- Name: assets_followers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_followers USING (true) WITH CHECK (true);


--
-- Name: assets_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.assets_materials USING (true) WITH CHECK (true);


--
-- Name: audits_logs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.audits_logs USING (true) WITH CHECK (true);


--
-- Name: carts_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.carts_materials USING (true) WITH CHECK (true);


--
-- Name: cfg_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_activities USING (true) WITH CHECK (true);


--
-- Name: cfg_app Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app USING (true) WITH CHECK (true);


--
-- Name: cfg_app_offline_updates Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app_offline_updates USING (true) WITH CHECK (true);


--
-- Name: cfg_app_pages Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app_pages USING (true) WITH CHECK (true);


--
-- Name: cfg_app_versions_update Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_app_versions_update USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_attributes Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_attributes USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_available_processing Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_available_processing USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_couplings_models Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_couplings_models USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_priorities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_priorities USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_tags Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_tags USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_tags_subs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_tags_subs USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_types USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_types_attributes Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_types_attributes USING (true) WITH CHECK (true);


--
-- Name: cfg_assets_unavailable_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_assets_unavailable_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_companies Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_companies USING (true) WITH CHECK (true);


--
-- Name: cfg_contracts_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_contracts_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_departments Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_departments USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_purchases_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_purchases_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_purchases_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_purchases_types USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_materials_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_materials_types USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_cancel_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_cancel_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_causes_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_causes_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_counter Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_counter USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_objects Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_objects USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_plans Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_plans USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_priorities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_priorities USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_suspended_reasons Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_suspended_reasons USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_types USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_types_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_types_activities USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_types_subs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_types_subs USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_visits_extras_processing Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_visits_extras_processing USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_visits_processing Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_visits_processing USING (true) WITH CHECK (true);


--
-- Name: cfg_orders_visits_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_orders_visits_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_profiles Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_profiles USING (true) WITH CHECK (true);


--
-- Name: cfg_profiles_access Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_profiles_access USING (true) WITH CHECK (true);


--
-- Name: cfg_profiles_permissions Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_profiles_permissions USING (true) WITH CHECK (true);


--
-- Name: cfg_routes Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_routes USING (true) WITH CHECK (true);


--
-- Name: cfg_services Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_services USING (true) WITH CHECK (true);


--
-- Name: cfg_systems Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_systems USING (true) WITH CHECK (true);


--
-- Name: cfg_teams Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_teams USING (true) WITH CHECK (true);


--
-- Name: cfg_technicals_manuals_categories Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_technicals_manuals_categories USING (true) WITH CHECK (true);


--
-- Name: cfg_units_assets_tags Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_units_assets_tags USING (true) WITH CHECK (true);


--
-- Name: cfg_units_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_units_statuses USING (true) WITH CHECK (true);


--
-- Name: cfg_units_types Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_units_types USING (true) WITH CHECK (true);


--
-- Name: cfg_users_statuses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.cfg_users_statuses USING (true) WITH CHECK (true);


--
-- Name: chat_agent_ai Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.chat_agent_ai USING (true) WITH CHECK (true);


--
-- Name: clients Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.clients USING (true) WITH CHECK (true);


--
-- Name: contracts Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.contracts USING (true) WITH CHECK (true);


--
-- Name: contracts_managers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.contracts_managers USING (true) WITH CHECK (true);


--
-- Name: contracts_services Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.contracts_services USING (true) WITH CHECK (true);


--
-- Name: documents Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.documents USING (true) WITH CHECK (true);


--
-- Name: extensions Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.extensions USING (true) WITH CHECK (true);


--
-- Name: impersonation_password_backup Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.impersonation_password_backup USING (true) WITH CHECK (true);


--
-- Name: import_orders_visits_contracts Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.import_orders_visits_contracts USING (true) WITH CHECK (true);


--
-- Name: logs_api Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.logs_api USING (true) WITH CHECK (true);


--
-- Name: maintenances_plans Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.maintenances_plans USING (true) WITH CHECK (true);


--
-- Name: maintenances_plans_sections Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.maintenances_plans_sections USING (true) WITH CHECK (true);


--
-- Name: maintenances_plans_sections_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.maintenances_plans_sections_activities USING (true) WITH CHECK (true);


--
-- Name: materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.materials USING (true) WITH CHECK (true);


--
-- Name: materials_purchases Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.materials_purchases USING (true) WITH CHECK (true);


--
-- Name: n8n_chat_histories Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.n8n_chat_histories USING (true) WITH CHECK (true);


--
-- Name: orders Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders USING (true) WITH CHECK (true);


--
-- Name: orders_followers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_followers USING (true) WITH CHECK (true);


--
-- Name: orders_statuses_logs Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_statuses_logs USING (true) WITH CHECK (true);


--
-- Name: orders_visits Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits USING (true) WITH CHECK (true);


--
-- Name: orders_visits_assets Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_assets USING (true) WITH CHECK (true);


--
-- Name: orders_visits_assets_activities Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_assets_activities USING (true) WITH CHECK (true);


--
-- Name: orders_visits_assets_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_assets_materials USING (true) WITH CHECK (true);


--
-- Name: orders_visits_chat Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_chat USING (true) WITH CHECK (true);


--
-- Name: orders_visits_chat_participants Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_chat_participants USING (true) WITH CHECK (true);


--
-- Name: orders_visits_chat_reads Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_chat_reads USING (true) WITH CHECK (true);


--
-- Name: orders_visits_extras Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_extras USING (true) WITH CHECK (true);


--
-- Name: orders_visits_extras_followers Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_extras_followers USING (true) WITH CHECK (true);


--
-- Name: orders_visits_extras_teams Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_extras_teams USING (true) WITH CHECK (true);


--
-- Name: orders_visits_services Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_services USING (true) WITH CHECK (true);


--
-- Name: orders_visits_teams Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_teams USING (true) WITH CHECK (true);


--
-- Name: orders_visits_vehicles Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.orders_visits_vehicles USING (true) WITH CHECK (true);


--
-- Name: technicals_manuals Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.technicals_manuals USING (true) WITH CHECK (true);


--
-- Name: technicals_manuals_assets Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.technicals_manuals_assets USING (true) WITH CHECK (true);


--
-- Name: technicals_manuals_files Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.technicals_manuals_files USING (true) WITH CHECK (true);


--
-- Name: tenants Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.tenants USING (true) WITH CHECK (true);


--
-- Name: tools Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.tools USING (true) WITH CHECK (true);


--
-- Name: units Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.units USING (true) WITH CHECK (true);


--
-- Name: users Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users USING (true) WITH CHECK (true);


--
-- Name: users_notifications Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_notifications USING (true) WITH CHECK (true);


--
-- Name: users_tools Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_tools USING (true) WITH CHECK (true);


--
-- Name: users_tools_movements Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_tools_movements USING (true) WITH CHECK (true);


--
-- Name: users_tracker Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.users_tracker USING (true) WITH CHECK (true);


--
-- Name: vehicles Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.vehicles USING (true) WITH CHECK (true);


--
-- Name: warehouses Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.warehouses USING (true) WITH CHECK (true);


--
-- Name: warehouses_materials Universal Access; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Universal Access" ON public.warehouses_materials USING (true) WITH CHECK (true);


--
-- Name: assets_loans Users can delete asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete asset loans" ON public.assets_loans FOR DELETE USING (true);


--
-- Name: cfg_assets_types_loans_checklists Users can delete asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR DELETE USING (true);


--
-- Name: assets_loans_checklists_images Users can delete checklist images; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete checklist images" ON public.assets_loans_checklists_images FOR DELETE USING (true);


--
-- Name: cfg_loans_checklists Users can delete loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete loans checklists" ON public.cfg_loans_checklists FOR DELETE USING (true);


--
-- Name: assets_loans Users can insert asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert asset loans" ON public.assets_loans FOR INSERT WITH CHECK (true);


--
-- Name: cfg_assets_types_loans_checklists Users can insert asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR INSERT WITH CHECK (true);


--
-- Name: assets_loans_checklists_images Users can insert checklist images; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert checklist images" ON public.assets_loans_checklists_images FOR INSERT WITH CHECK (true);


--
-- Name: cfg_loans_checklists Users can insert loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert loans checklists" ON public.cfg_loans_checklists FOR INSERT WITH CHECK (true);


--
-- Name: assets_loans Users can update asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update asset loans" ON public.assets_loans FOR UPDATE USING (true);


--
-- Name: cfg_assets_types_loans_checklists Users can update asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR UPDATE USING (true);


--
-- Name: cfg_loans_checklists Users can update loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update loans checklists" ON public.cfg_loans_checklists FOR UPDATE USING (true);


--
-- Name: assets_loans Users can view asset loans; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view asset loans" ON public.assets_loans FOR SELECT USING (true);


--
-- Name: cfg_assets_types_loans_checklists Users can view asset type checklist associations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view asset type checklist associations" ON public.cfg_assets_types_loans_checklists FOR SELECT USING (true);


--
-- Name: assets_loans_checklists_images Users can view checklist images; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view checklist images" ON public.assets_loans_checklists_images FOR SELECT USING (true);


--
-- Name: cfg_loans_checklists Users can view loans checklists; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can view loans checklists" ON public.cfg_loans_checklists FOR SELECT USING (true);


--
-- Name: cfg_app_tips View active tips; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "View active tips" ON public.cfg_app_tips FOR SELECT USING (((is_active = true) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: cfg_app_tips_dismissals View dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "View dismissals" ON public.cfg_app_tips_dismissals FOR SELECT USING (((user_id = ( SELECT users.id
   FROM public.users
  WHERE (users.uuid = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.uuid = ( SELECT auth.uid() AS uid)) AND (users.is_admin_super = true))))));


--
-- Name: ai_chat_histories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_0" ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK ((bucket_id = 'siges'::text));


--
-- Name: objects Grant All Authenticated 1t5kqn_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_1" ON storage.objects FOR SELECT TO authenticated, anon USING ((bucket_id = 'siges'::text));


--
-- Name: objects Grant All Authenticated 1t5kqn_2; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_2" ON storage.objects FOR UPDATE TO authenticated, anon USING ((bucket_id = 'siges'::text));


--
-- Name: objects Grant All Authenticated 1t5kqn_3; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Grant All Authenticated 1t5kqn_3" ON storage.objects FOR DELETE TO authenticated, anon USING ((bucket_id = 'siges'::text));


--
-- Name: objects Universal Storage Access; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Universal Storage Access" ON storage.objects USING (((bucket_id = 'siges'::text) OR (bucket_id = 'contracts'::text))) WITH CHECK (((bucket_id = 'siges'::text) OR (bucket_id = 'contracts'::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

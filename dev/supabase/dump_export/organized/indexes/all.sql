CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: cfg_units_assets_tags_asset_tag_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX cfg_units_assets_tags_asset_tag_id_idx ON public.cfg_units_assets_tags USING btree (asset_tag_id);


--
-- Name: cfg_units_assets_tags_last_processing_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX cfg_units_assets_tags_last_processing_id_idx ON public.cfg_units_assets_tags USING btree (last_processing_id);


--
-- Name: cfg_units_assets_tags_unit_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX cfg_units_assets_tags_unit_id_idx ON public.cfg_units_assets_tags USING btree (unit_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON public.extensions USING btree (tenant_external_id, type);


--
-- Name: idx_assets_alerts_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_alerts_o_id ON public.assets_alerts USING btree (o_id);


--
-- Name: idx_assets_alerts_o_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_alerts_o_type_id ON public.assets_alerts USING btree (o_type_id);


--
-- Name: idx_assets_alerts_ova_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_alerts_ova_id ON public.assets_alerts USING btree (ova_id);


--
-- Name: idx_assets_available_asset_tag_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_available_asset_tag_sub_id ON public.assets_available USING btree (asset_tag_sub_id);


--
-- Name: idx_assets_available_latest; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_available_latest ON public.assets_available USING btree (unit_id, asset_tag_id, flow_rate_unit, power_unit, pressure_unit, reported_at DESC);


--
-- Name: idx_assets_code_trgm; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_code_trgm ON public.assets USING gin (code extensions.gin_trgm_ops);


--
-- Name: idx_assets_company_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_company_id ON public.assets USING btree (company_id);


--
-- Name: idx_assets_description; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_description ON public.assets USING btree (description);


--
-- Name: idx_assets_loans_asset; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_asset ON public.assets_loans USING btree (asset_id);


--
-- Name: idx_assets_loans_checklists_images_checklist; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_checklists_images_checklist ON public.assets_loans_checklists_images USING btree (checklist_id);


--
-- Name: idx_assets_loans_checklists_loan_checklist; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_checklists_loan_checklist ON public.assets_loans_checklists USING btree (loan_checklist_id);


--
-- Name: idx_assets_loans_expected_return; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_expected_return ON public.assets_loans USING btree (expected_return_date);


--
-- Name: idx_assets_loans_lender; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_lender ON public.assets_loans USING btree (lender_user_id);


--
-- Name: idx_assets_loans_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_loans_status ON public.assets_loans USING btree (status);


--
-- Name: idx_assets_material_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_material_id ON public.assets USING btree (material_id);


--
-- Name: idx_assets_searchable; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_searchable ON public.assets USING gin (to_tsvector('portuguese'::regconfig, searchable));


--
-- Name: idx_assets_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_type_id ON public.assets USING btree (type_id);


--
-- Name: idx_assets_unit_asset_tag_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_unit_asset_tag_id ON public.assets USING btree (unit_asset_tag_id);


--
-- Name: idx_assets_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_assets_unit_id ON public.assets USING btree (unit_id);


--
-- Name: idx_cfg_app_notices_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_active ON public.cfg_app_notices USING btree (is_active, start_date, end_date);


--
-- Name: idx_cfg_app_notices_created_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_created_at ON public.cfg_app_notices USING btree (created_at DESC);


--
-- Name: idx_cfg_app_notices_created_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_created_user_id ON public.cfg_app_notices USING btree (created_user_id);


--
-- Name: idx_cfg_app_notices_date_range; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_notices_date_range ON public.cfg_app_notices USING btree (start_date, end_date);


--
-- Name: idx_cfg_app_tips_companies_tip_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_companies_tip_id ON public.cfg_app_tips_companies USING btree (tip_id);


--
-- Name: idx_cfg_app_tips_created_by; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_created_by ON public.cfg_app_tips USING btree (created_by);


--
-- Name: idx_cfg_app_tips_departments_tip_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_departments_tip_id ON public.cfg_app_tips_departments USING btree (tip_id);


--
-- Name: idx_cfg_app_tips_dismissals_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_dismissals_user_id ON public.cfg_app_tips_dismissals USING btree (user_id);


--
-- Name: idx_cfg_app_tips_profiles_tip_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_profiles_tip_id ON public.cfg_app_tips_profiles USING btree (tip_id);


--
-- Name: idx_cfg_app_tips_screen_target; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_app_tips_screen_target ON public.cfg_app_tips USING btree (screen_target);


--
-- Name: idx_cfg_assets_attributes_groups_group_name_unique; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE UNIQUE INDEX idx_cfg_assets_attributes_groups_group_name_unique ON public.cfg_assets_attributes_groups USING btree (group_name) WHERE (parent_id IS NULL);


--
-- Name: idx_cfg_assets_attributes_groups_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_attributes_groups_parent_id ON public.cfg_assets_attributes_groups USING btree (parent_id);


--
-- Name: idx_cfg_assets_attributes_select_options_group_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_attributes_select_options_group_id ON public.cfg_assets_attributes USING btree (select_options_group_id);


--
-- Name: idx_cfg_assets_tags_description; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_tags_description ON public.cfg_assets_tags USING btree (id, description);


--
-- Name: idx_cfg_assets_types_attributes_attribute_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_types_attributes_attribute_id ON public.cfg_assets_types_attributes USING btree (attribute_id);


--
-- Name: idx_cfg_assets_types_loans_checklists_asset_type; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_types_loans_checklists_asset_type ON public.cfg_assets_types_loans_checklists USING btree (asset_type_id);


--
-- Name: idx_cfg_assets_types_loans_checklists_checklist; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_assets_types_loans_checklists_checklist ON public.cfg_assets_types_loans_checklists USING btree (checklist_id);


--
-- Name: idx_cfg_loans_checklists_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_loans_checklists_active ON public.cfg_loans_checklists USING btree (is_active);


--
-- Name: idx_cfg_routes_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_routes_parent_id ON public.cfg_routes USING btree (parent_id);


--
-- Name: idx_cfg_units_assets_tags_agg; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_agg ON public.cfg_units_assets_tags USING btree (asset_tag_id, last_processing_id, is_deleted);


--
-- Name: idx_cfg_units_assets_tags_asset_tag_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_asset_tag_sub_id ON public.cfg_units_assets_tags USING btree (asset_tag_sub_id);


--
-- Name: idx_cfg_units_assets_tags_created_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_created_user_id ON public.cfg_units_assets_tags USING btree (created_user_id);


--
-- Name: idx_cfg_units_assets_tags_deleted_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_deleted_user_id ON public.cfg_units_assets_tags USING btree (deleted_user_id);


--
-- Name: idx_cfg_units_assets_tags_last_created_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_last_created_user_id ON public.cfg_units_assets_tags USING btree (last_created_user_id);


--
-- Name: idx_cfg_units_assets_tags_last_reported_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cfg_units_assets_tags_last_reported_user_id ON public.cfg_units_assets_tags USING btree (last_reported_user_id);


--
-- Name: idx_contracts_eval_req_evaluation_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_contracts_eval_req_evaluation_id ON public.contracts_evaluation_requirements USING btree (evaluation_id);


--
-- Name: idx_contracts_evaluation_requirements_contract; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_contracts_evaluation_requirements_contract ON public.contracts_evaluation_requirements USING btree (contract_id);


--
-- Name: idx_cuat_active_reporting; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_cuat_active_reporting ON public.cfg_units_assets_tags USING btree (unit_id, asset_tag_id, last_reported_at) INCLUDE (is_deleted, last_asset_available_rate, last_flow_rate, last_power, last_pressure, flow_rate_max, power_max, pressure_max, last_processing_id) WHERE (is_deleted = false);


--
-- Name: idx_leader_monthly_scores_dept_period; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_monthly_scores_dept_period ON public.leader_monthly_scores USING btree (department_id, score_year, score_month);


--
-- Name: idx_leader_monthly_scores_leader; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_monthly_scores_leader ON public.leader_monthly_scores USING btree (leader_id);


--
-- Name: idx_leader_score_badges_leader; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_score_badges_leader ON public.leader_score_badges USING btree (leader_id);


--
-- Name: idx_leader_score_badges_period; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_leader_score_badges_period ON public.leader_score_badges USING btree (score_year, score_month);


--
-- Name: idx_logs_api_key_created; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_logs_api_key_created ON public.logs_api USING btree (api_key, created_at DESC);


--
-- Name: idx_maintenances_plans_sections_activities_activity_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_maintenances_plans_sections_activities_activity_id ON public.maintenances_plans_sections_activities USING btree (activity_id);


--
-- Name: idx_material_purchases_material; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_material_purchases_material ON public.materials_purchases USING btree (material_id);


--
-- Name: idx_materials_id_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_materials_id_active ON public.materials USING btree (id) WHERE (is_deleted = false);


--
-- Name: idx_materials_purchases_cancel_reason_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_materials_purchases_cancel_reason_id ON public.materials_purchases USING btree (cancel_reason_id);


--
-- Name: idx_orders_asset_tag_parent_requested; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_asset_tag_parent_requested ON public.orders USING btree (asset_tag_id, requested_at DESC) WHERE (parent_id IS NOT NULL);


--
-- Name: idx_orders_company_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_company_id ON public.orders USING btree (company_id);


--
-- Name: idx_orders_company_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_company_status ON public.orders USING btree (company_id, status_id);


--
-- Name: idx_orders_completed_lookup; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_completed_lookup ON public.orders USING btree (status_id, parent_id, status_at DESC);


--
-- Name: idx_orders_contract_parent_requested; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_contract_parent_requested ON public.orders USING btree (contract_id, requested_at DESC) WHERE (parent_id IS NOT NULL);


--
-- Name: idx_orders_followers_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_followers_o_id ON public.orders_followers USING btree (o_id);


--
-- Name: idx_orders_is_deleted; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_is_deleted ON public.orders USING btree (is_deleted);


--
-- Name: idx_orders_object_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_object_id ON public.orders USING btree (object_id);


--
-- Name: idx_orders_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_parent_id ON public.orders USING btree (parent_id);


--
-- Name: idx_orders_parent_not_null_requested_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_parent_not_null_requested_at ON public.orders USING btree (requested_at DESC, status_id) WHERE (parent_id IS NOT NULL);


--
-- Name: idx_orders_requested_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_requested_at ON public.orders USING btree (requested_at);


--
-- Name: idx_orders_requested_at_desc; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_requested_at_desc ON public.orders USING btree (requested_at DESC);


--
-- Name: idx_orders_status_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_status_at ON public.orders USING btree (status_at DESC);


--
-- Name: idx_orders_status_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_status_id ON public.orders USING btree (status_id);


--
-- Name: idx_orders_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_type_id ON public.orders USING btree (type_id);


--
-- Name: idx_orders_type_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_type_sub_id ON public.orders USING btree (type_sub_id);


--
-- Name: idx_orders_unit_asset_tag_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_unit_asset_tag_id ON public.orders USING btree (unit_asset_tag_id);


--
-- Name: idx_orders_unit_contract; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_unit_contract ON public.orders USING btree (unit_id, contract_id);


--
-- Name: idx_orders_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_unit_id ON public.orders USING btree (unit_id);


--
-- Name: idx_orders_visits_assets_activities_plan_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_assets_activities_plan_id ON public.orders_visits_assets_activities USING btree (maintenance_plan_id);


--
-- Name: idx_orders_visits_assets_after_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_assets_after_unit_id ON public.orders_visits_assets USING btree (after_unit_id);


--
-- Name: idx_orders_visits_assets_before_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_assets_before_unit_id ON public.orders_visits_assets USING btree (before_unit_id);


--
-- Name: idx_orders_visits_chat_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_ov_id ON public.orders_visits_chat USING btree (ov_id);


--
-- Name: idx_orders_visits_chat_participants_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_participants_user_id ON public.orders_visits_chat_participants USING btree (user_id);


--
-- Name: idx_orders_visits_chat_reads_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_reads_user_id ON public.orders_visits_chat_reads USING btree (user_id);


--
-- Name: idx_orders_visits_chat_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_chat_user_id ON public.orders_visits_chat USING btree (user_id);


--
-- Name: idx_orders_visits_costs_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_costs_status ON public.orders_visits USING btree (ov_costs_status) WHERE (ov_costs_status IS NOT NULL);


--
-- Name: idx_orders_visits_costs_submitted; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_costs_submitted ON public.orders_visits USING btree (ov_costs_status, ov_processing_id) WHERE (ov_costs_status = 'submitted'::text);


--
-- Name: idx_orders_visits_evaluations_ov; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_evaluations_ov ON public.orders_visits_evaluations USING btree (ov_id);


--
-- Name: idx_orders_visits_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_o_id ON public.orders_visits USING btree (o_id);


--
-- Name: idx_orders_visits_processing; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_processing ON public.orders_visits USING btree (ov_processing_id, ov_status_id);


--
-- Name: idx_orders_visits_services_aggregation; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_services_aggregation ON public.orders_visits_services USING btree (ov_id, service_id, value_unit, discount) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_services_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_services_ov_id ON public.orders_visits_services USING btree (ov_id) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_started_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_started_at ON public.orders_visits USING btree (ov_started_at DESC);


--
-- Name: idx_orders_visits_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_status ON public.orders_visits USING btree (ov_status_id);


--
-- Name: idx_orders_visits_teams_leader; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_teams_leader ON public.orders_visits_teams USING btree (ov_id, is_leader, order_id);


--
-- Name: idx_orders_visits_teams_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_teams_ov_id ON public.orders_visits_teams USING btree (ov_id);


--
-- Name: idx_orders_visits_teams_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_teams_user_id ON public.orders_visits_teams USING btree (user_id);


--
-- Name: idx_orders_visits_vehicles_aggregation; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_vehicles_aggregation ON public.orders_visits_vehicles USING btree (ov_id, vehicle_id, value_unit, discount) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_vehicles_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_vehicles_ov_id ON public.orders_visits_vehicles USING btree (ov_id) WHERE (is_deleted = false);


--
-- Name: idx_orders_visits_vehicles_vehicle_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_visits_vehicles_vehicle_id ON public.orders_visits_vehicles USING btree (vehicle_id);


--
-- Name: idx_orders_year; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_orders_year ON public.orders USING btree (year);


--
-- Name: idx_ov_assets_ov_processing; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_assets_ov_processing ON public.orders_visits_assets USING btree (ov_id, processing_id);


--
-- Name: idx_ov_chat_closed_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_chat_closed_user_id ON public.orders_visits USING btree (chat_closed_user_id);


--
-- Name: idx_ov_chat_created_user; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_chat_created_user ON public.orders_visits USING btree (chat_created_user_id);


--
-- Name: idx_ov_chat_status; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_chat_status ON public.orders_visits USING btree (chat_status);


--
-- Name: idx_ov_costs_approved_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_costs_approved_user_id ON public.orders_visits USING btree (ov_costs_approved_user_id);


--
-- Name: idx_ov_costs_rejected_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_costs_rejected_user_id ON public.orders_visits USING btree (ov_costs_rejected_user_id);


--
-- Name: idx_ov_costs_waiting_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_costs_waiting_user_id ON public.orders_visits USING btree (ov_costs_waiting_user_id);


--
-- Name: idx_ov_started_at; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_started_at ON public.orders_visits USING btree (ov_started_at);


--
-- Name: idx_ov_team_leader_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ov_team_leader_id ON public.orders_visits USING btree (ov_team_leader_id);


--
-- Name: idx_ova_asset_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_asset_id ON public.orders_visits_assets USING btree (asset_id);


--
-- Name: idx_ova_is_deleted; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_is_deleted ON public.orders_visits_assets USING btree (is_deleted);


--
-- Name: idx_ova_o_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_o_id ON public.orders_visits_assets USING btree (o_id);


--
-- Name: idx_ova_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ova_ov_id ON public.orders_visits_assets USING btree (ov_id);


--
-- Name: idx_ovaa_ova_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovaa_ova_id ON public.orders_visits_assets_activities USING btree (ova_id);


--
-- Name: idx_ovcp_ov_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovcp_ov_id ON public.orders_visits_chat_participants USING btree (ov_id);


--
-- Name: idx_ove_asset_tag_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_asset_tag_id ON public.orders_visits_extras USING btree (asset_tag_id);


--
-- Name: idx_ove_contract_evaluation_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_contract_evaluation_id ON public.orders_visits_evaluations USING btree (contract_evaluation_id);


--
-- Name: idx_ove_o_cause_reason_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_o_cause_reason_id ON public.orders_visits_extras USING btree (o_cause_reason_id);


--
-- Name: idx_ove_o_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_o_type_id ON public.orders_visits_extras USING btree (o_type_id);


--
-- Name: idx_ove_o_type_sub_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_o_type_sub_id ON public.orders_visits_extras USING btree (o_type_sub_id);


--
-- Name: idx_ove_priority_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_priority_id ON public.orders_visits_extras USING btree (priority_id);


--
-- Name: idx_ove_processing_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_processing_id ON public.orders_visits_extras USING btree (processing_id);


--
-- Name: idx_ove_system_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_system_id ON public.orders_visits_extras USING btree (system_id);


--
-- Name: idx_ove_system_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_system_parent_id ON public.orders_visits_extras USING btree (system_parent_id);


--
-- Name: idx_ove_team_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_team_id ON public.orders_visits_extras USING btree (team_id);


--
-- Name: idx_ove_team_leader_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_team_leader_id ON public.orders_visits_extras USING btree (team_leader_id);


--
-- Name: idx_ove_unit_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_unit_id ON public.orders_visits_extras USING btree (unit_id);


--
-- Name: idx_ove_unit_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_unit_type_id ON public.orders_visits_extras USING btree (unit_type_id);


--
-- Name: idx_ove_unit_type_parent_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ove_unit_type_parent_id ON public.orders_visits_extras USING btree (unit_type_parent_id);


--
-- Name: idx_ovef_ove_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovef_ove_id ON public.orders_visits_extras_followers USING btree (ove_id);


--
-- Name: idx_ovef_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovef_user_id ON public.orders_visits_extras_followers USING btree (user_id);


--
-- Name: idx_ovet_ove_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovet_ove_id ON public.orders_visits_extras_teams USING btree (ove_id);


--
-- Name: idx_ovet_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_ovet_user_id ON public.orders_visits_extras_teams USING btree (user_id);


--
-- Name: idx_profiles_access_profile_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_profiles_access_profile_id ON public.cfg_profiles_access USING btree (profile_id);


--
-- Name: idx_profiles_access_route_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_profiles_access_route_id ON public.cfg_profiles_access USING btree (route_id);


--
-- Name: idx_tools_material_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_tools_material_id ON public.tools USING btree (material_id);


--
-- Name: idx_trgm_orders_visits_ov_mask; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_trgm_orders_visits_ov_mask ON public.orders_visits USING gin (ov_mask extensions.gin_trgm_ops);


--
-- Name: idx_units_active; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_active ON public.units USING btree (status_id, version_mode) WHERE (is_deleted = false);


--
-- Name: idx_units_id_parent; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_id_parent ON public.units USING btree (id, system_parent_id);


--
-- Name: idx_units_status_version; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_status_version ON public.units USING btree (status_id, version_mode);


--
-- Name: idx_units_system_parent; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_system_parent ON public.units USING btree (system_parent_id);


--
-- Name: idx_units_unit_type_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_units_unit_type_id ON public.units USING btree (unit_type_id);


--
-- Name: idx_users_availability; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_availability ON public.users USING btree (id, is_available, name_short);


--
-- Name: idx_users_available; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_available ON public.users USING btree (team_id, company_id) WHERE (is_available = true);


--
-- Name: idx_users_company_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_company_id ON public.users USING btree (company_id);


--
-- Name: idx_users_is_available; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_is_available ON public.users USING btree (is_available);


--
-- Name: idx_users_name_full_asc; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_name_full_asc ON public.users USING btree (name_full);


--
-- Name: idx_users_notifications_user_id_from; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_notifications_user_id_from ON public.users_notifications USING btree (user_id_from);


--
-- Name: idx_users_notifications_user_id_to; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_notifications_user_id_to ON public.users_notifications USING btree (user_id_to);


--
-- Name: idx_users_profile_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_profile_id ON public.users USING btree (profile_id);


--
-- Name: idx_users_status_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_status_id ON public.users USING btree (status_id);


--
-- Name: idx_users_team_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_team_id ON public.users USING btree (team_id);


--
-- Name: idx_users_tools_mov_tool_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_tools_mov_tool_id ON public.users_tools_movements USING btree (tool_id);


--
-- Name: idx_users_tools_tool_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_tools_tool_id ON public.users_tools USING btree (tool_id);


--
-- Name: idx_users_tools_user_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_tools_user_id ON public.users_tools USING btree (user_id);


--
-- Name: idx_users_uuid; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_users_uuid ON public.users USING btree (uuid);


--
-- Name: idx_vehicles_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_vehicles_id ON public.vehicles USING btree (id);


--
-- Name: idx_wm_material_id; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX idx_wm_material_id ON public.warehouses_materials USING btree (material_id);


--
-- Name: materials_code_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX materials_code_idx ON public.materials USING btree (code);


--
-- Name: materials_finger_print_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX materials_finger_print_idx ON public.materials USING btree (finger_print);


--
-- Name: orders_contract_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX orders_contract_id_idx ON public.orders USING btree (contract_id);


--
-- Name: orders_followers_user_id_o_id_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX orders_followers_user_id_o_id_idx ON public.orders_followers USING btree (user_id, o_id);


--
-- Name: orders_visits_finger_print_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX orders_visits_finger_print_idx ON public.orders_visits USING btree (finger_print);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE UNIQUE INDEX tenants_external_id_index ON public.tenants USING btree (external_id);


--
-- Name: users_notifications_created_at_idx; Type: INDEX; Schema: public; Owner: supabase_admin
--

CREATE INDEX users_notifications_created_at_idx ON public.users_notifications USING btree (created_at);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_iceberg_namespaces_bucket_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces USING btree (bucket_id, name);


--
-- Name: idx_iceberg_tables_namespace_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables USING btree (namespace_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

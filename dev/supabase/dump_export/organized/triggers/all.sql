CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: users_notifications n8n_whatsappUserNotification; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER "n8n_whatsappUserNotification" AFTER INSERT ON public.users_notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://services-n8n-webhook.2unk5k.easypanel.host/webhook/whatsappUserNotification', 'POST', '{"Content-type":"application/json"}', '{}', '5000');


--
-- Name: users on_profile_photo_change; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER on_profile_photo_change AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_profile_photo_change_notification();


--
-- Name: users on_user_updated; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER on_user_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: orders_visits_assets tgr_after_img_file_name_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_after_img_file_name_update BEFORE INSERT OR UPDATE OF after_img_files_names ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_after_img_file_name();


--
-- Name: orders_visits_assets tgr_after_img_files_names_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_after_img_files_names_update BEFORE INSERT OR UPDATE OF after_img_file_name ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_after_img_files_names();


--
-- Name: assets tgr_assets_searchable_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_assets_searchable_update BEFORE INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.fc_assets_searchable_update();


--
-- Name: orders_visits_assets tgr_before_img_file_name_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_before_img_file_name_update BEFORE INSERT OR UPDATE OF before_img_files_names ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_before_img_file_name();


--
-- Name: orders_visits_assets tgr_before_img_files_names_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_before_img_files_names_update BEFORE INSERT OR UPDATE OF before_img_file_name ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_update_before_img_files_names();


--
-- Name: cfg_units_assets_tags tgr_cfg_units_assets_tags_set_last_values_when_processing_2; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_cfg_units_assets_tags_set_last_values_when_processing_2 BEFORE UPDATE ON public.cfg_units_assets_tags FOR EACH ROW EXECUTE FUNCTION public.fc_cfg_units_assets_tags_set_last_values_when_processing_2();


--
-- Name: orders_visits tgr_durations_hours_decimals; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_durations_hours_decimals BEFORE INSERT OR UPDATE ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_durations_hours_decimals();


--
-- Name: materials tgr_materials_searchable; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_materials_searchable BEFORE INSERT OR UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.fc_materials_searchable();


--
-- Name: orders tgr_orders_sanitize_requested_services; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_sanitize_requested_services BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_orders_replace_special_chars();


--
-- Name: orders_visits_assets_activities tgr_orders_visits_assets_activities_description; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_visits_assets_activities_description AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets_activities FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_activities_description();


--
-- Name: orders_visits_assets tgr_orders_visits_assets_update_activities_searchable; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_visits_assets_update_activities_searchable AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_activities_searchable();


--
-- Name: orders_visits_services tgr_orders_visits_services_amount_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_orders_visits_services_amount_update BEFORE INSERT OR UPDATE ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_amount_update();


--
-- Name: units tgr_units_searchable; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER tgr_units_searchable BEFORE INSERT OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.fc_tgr_units_searchable();


--
-- Name: orders_visits trg_audit_visit_costs_status; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_audit_visit_costs_status AFTER UPDATE OF ov_costs_status ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fn_audit_visit_costs_status();


--
-- Name: cfg_app_notices trg_cfg_app_notices_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_cfg_app_notices_updated_at BEFORE UPDATE ON public.cfg_app_notices FOR EACH ROW EXECUTE FUNCTION public.update_cfg_app_notices_updated_at();


--
-- Name: orders trg_followers_orders_status_changed; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_followers_orders_status_changed AFTER UPDATE OF status_id ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_followers_orders_status_changed();


--
-- Name: import_orders_visits_contracts trg_import_orders_visits_contracts_update_finger_print; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_import_orders_visits_contracts_update_finger_print BEFORE INSERT OR UPDATE ON public.import_orders_visits_contracts FOR EACH ROW EXECUTE FUNCTION public.fc_import_orders_visits_contracts_update_finger_print();


--
-- Name: users trg_leader_tracker_interval; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_leader_tracker_interval BEFORE UPDATE OF is_ov_in_progress, is_team_leader ON public.users FOR EACH ROW EXECUTE FUNCTION public.fc_leader_tracker_interval();


--
-- Name: orders trg_order_status_inheritance; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_order_status_inheritance AFTER UPDATE OF status_id, status_at ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_order_status_inheritance();


--
-- Name: orders trg_orders_op_counter; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_op_counter AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_orders_op_counter_trigger();


--
-- Name: orders_visits_assets_materials trg_orders_visits_assets_materials_update_value_total; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_materials_update_value_total BEFORE INSERT OR UPDATE ON public.orders_visits_assets_materials FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_materials_update_value_total();


--
-- Name: orders_visits_assets_materials trg_orders_visits_assets_update_materials_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_update_materials_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_assets_materials FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_materials_value();


--
-- Name: orders_visits trg_orders_visits_assets_update_services_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_update_services_value AFTER UPDATE OF ov_services_value, ov_assets_amount ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_services_value();


--
-- Name: orders_visits trg_orders_visits_assets_update_vehicles_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_assets_update_vehicles_value AFTER UPDATE OF ov_vehicles_value, ov_assets_amount ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_assets_update_vehicles_value();


--
-- Name: orders_visits_services trg_orders_visits_services_update_services_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_services_update_services_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_update_services_value();


--
-- Name: orders_visits_services trg_orders_visits_services_update_value_unit; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_services_update_value_unit BEFORE INSERT ON public.orders_visits_services FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_services_update_value_unit();


--
-- Name: orders_visits_teams trg_orders_visits_teams_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_teams_update AFTER INSERT OR DELETE ON public.orders_visits_teams FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_teams_update();


--
-- Name: orders_visits trg_orders_visits_update_total_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_update_total_value AFTER UPDATE OF ov_materials_value, ov_services_value, ov_vehicles_value ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_update_total_value();


--
-- Name: orders_visits_vehicles trg_orders_visits_vehicles_before_save; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_vehicles_before_save BEFORE INSERT OR UPDATE ON public.orders_visits_vehicles FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_vehicles_before_save();


--
-- Name: orders_visits_vehicles trg_orders_visits_vehicles_update_vehicles_value; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_orders_visits_vehicles_update_vehicles_value AFTER INSERT OR DELETE OR UPDATE ON public.orders_visits_vehicles FOR EACH ROW EXECUTE FUNCTION public.fc_orders_visits_vehicles_update_vehicles_value();


--
-- Name: orders_visits trg_set_ov_started_date_parts; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_set_ov_started_date_parts BEFORE INSERT OR UPDATE OF ov_started_at ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_set_ov_started_date_parts();


--
-- Name: orders_visits trg_sync_ov_costs_status; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_sync_ov_costs_status AFTER UPDATE OF ov_costs_status ON public.orders_visits FOR EACH ROW EXECUTE FUNCTION public.fc_sync_ov_costs_status();


--
-- Name: orders_visits_assets trg_total_value_update; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_total_value_update BEFORE INSERT OR UPDATE ON public.orders_visits_assets FOR EACH ROW EXECUTE FUNCTION public.fc_total_value_update();


--
-- Name: cfg_assets_tags trg_units_assets_tags_update_asset_tag_description; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_units_assets_tags_update_asset_tag_description AFTER UPDATE OF description ON public.cfg_assets_tags FOR EACH ROW EXECUTE FUNCTION public.fc_units_assets_tags_update_asset_tag_description();


--
-- Name: cfg_assets_tags_subs trg_units_assets_tags_update_asset_tag_sub_description; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_units_assets_tags_update_asset_tag_sub_description AFTER UPDATE OF description ON public.cfg_assets_tags_subs FOR EACH ROW EXECUTE FUNCTION public.fc_units_assets_tags_update_asset_tag_sub_description();


--
-- Name: orders trg_units_assets_tags_update_op_counter; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trg_units_assets_tags_update_op_counter AFTER INSERT OR UPDATE OF unit_asset_tag_has_order ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fc_units_assets_tags_update_op_counter();


--
-- Name: cfg_app_notices trigger_update_cfg_app_notices_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trigger_update_cfg_app_notices_updated_at BEFORE UPDATE ON public.cfg_app_notices FOR EACH ROW EXECUTE FUNCTION public.update_system_notices_updated_at();


--
-- Name: cfg_app_tips trigger_update_cfg_app_tips_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER trigger_update_cfg_app_tips_updated_at BEFORE UPDATE ON public.cfg_app_tips FOR EACH ROW EXECUTE FUNCTION public.update_cfg_app_tips_updated_at();


--
-- Name: users users_change_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER users_change_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.change_updated_at();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

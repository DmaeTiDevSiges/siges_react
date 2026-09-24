# Análise da estrutura do banco (dump Contabo)

- **Arquivo fonte:** `SigesSupabaseContabo_backup_2026-09-23_02-45-06.dump`
- **Formato:** PostgreSQL custom (pg_dump 15.15 / server 15.8)
- **Extração:** `pg_restore --schema-only` (PostgreSQL client 18.6 local)

## Contagens gerais

| Objeto | Total | Schema public |
|--------|------:|--------------:|
| Tables | 160 | 130 |
| Views | 86 | 86 |
| Functions | 122 | 89 |
| Triggers | 50 | — |
| Policies (RLS) | 172 | — |
| RLS habilitado | 156 | — |
| Indexes | 224 | — |
| Sequences | 33 | — |
| Types | 10 | — |
| Grants/Revoke | 2815 | — |
| Extensions | (nenhuma no dump) | |
| Schemas | auth, public, storage | |

## Issues encontrados

- **4 tabelas sem RLS** — risco se expostas via PostgREST/anon.
- **26 tabelas com RLS mas sem policy** — acesso negado por padrão (pode ser intencional ou quebrar features).
- **33 funções sem `SET search_path`** explícito — risco de search_path hijacking / SECURITY DEFINER inseguro.
- **139 policies com `TO public` estrito ou `USING (true)`** — revisar necessidade.

### 1) Tabelas sem RLS (4)

```
auth.oauth_authorizations
auth.oauth_clients
auth.oauth_consents
public.assets_loans_checklists
```

### 2) RLS habilitado sem policy (26)

```
auth.audit_log_entries
auth.flow_state
auth.identities
auth.instances
auth.mfa_amr_claims
auth.mfa_challenges
auth.mfa_factors
auth.one_time_tokens
auth.refresh_tokens
auth.saml_providers
auth.saml_relay_states
auth.schema_migrations
auth.sessions
auth.sso_domains
auth.sso_providers
auth.users
storage.buckets
storage.buckets_analytics
storage.buckets_vectors
storage.iceberg_namespaces
storage.iceberg_tables
storage.migrations
storage.prefixes
storage.s3_multipart_uploads
storage.s3_multipart_uploads_parts
storage.vector_indexes
```

### 3) Funções sem SET search_path (33)

```
auth.email
auth.jwt
auth.role
auth.uid
storage.add_prefixes
storage.can_insert_object
storage.delete_leaf_prefixes
storage.delete_prefix
storage.delete_prefix_hierarchy_trigger
storage.enforce_bucket_name_length
storage.extension
storage.filename
storage.foldername
storage.get_level
storage.get_prefix
storage.get_prefixes
storage.get_size_by_bucket
storage.list_multipart_uploads_with_delimiter
storage.list_objects_with_delimiter
storage.lock_top_prefixes
storage.objects_delete_cleanup
storage.objects_insert_prefix_trigger
storage.objects_update_cleanup
storage.objects_update_level_trigger
storage.objects_update_prefix_trigger
storage.operation
storage.prefixes_delete_cleanup
storage.prefixes_insert_trigger
storage.search
storage.search_legacy_v1
storage.search_v1_optimised
storage.search_v2
storage.update_updated_at_column
```

### 4) Policies possivelmente permissivas (TO public / USING true)

| tabela | policy | roles | cmd |
|--------|--------|-------|-----|
| public.cfg_evaluation_requirements | Allow all authenticated delete cfg_evaluation_requirements | `authenticated` | DELETE |
| public.contracts_evaluation_requirements | Allow all authenticated delete contracts_evaluation_requirement | `authenticated` | DELETE |
| public.orders_visits_evaluations | Allow all authenticated delete orders_visits_evaluations | `authenticated` | DELETE |
| public.cfg_materials_purchases_cancel_reasons | Allow all authenticated read | `authenticated` | SELECT |
| public.cfg_evaluation_requirements | Allow all authenticated read cfg_evaluation_requirements | `authenticated` | SELECT |
| public.contracts_evaluation_requirements | Allow all authenticated read contracts_evaluation_requirements | `authenticated` | SELECT |
| public.orders_visits_evaluations | Allow all authenticated read orders_visits_evaluations | `authenticated` | SELECT |
| public.cfg_evaluation_requirements | Allow all authenticated update cfg_evaluation_requirements | `authenticated` | UPDATE |
| public.contracts_evaluation_requirements | Allow all authenticated update contracts_evaluation_requirement | `authenticated` | UPDATE |
| public.orders_visits_evaluations | Allow all authenticated update orders_visits_evaluations | `authenticated` | UPDATE |
| public.cfg_app_tips_companies | Anyone can view tip companies | `` | SELECT |
| public.cfg_app_tips_departments | Anyone can view tip departments | `` | SELECT |
| public.cfg_app_tips_profiles | Anyone can view tip profiles | `` | SELECT |
| public.goose_db_version | Authenticated can read goose_db_version | `authenticated` | SELECT |
| public.leader_monthly_scores | Authenticated can read leader_monthly_scores | `authenticated` | SELECT |
| public.leader_score_badges | Authenticated can read leader_score_badges | `authenticated` | SELECT |
| public.leader_scores_history | Authenticated can read leader_scores_history | `authenticated` | SELECT |
| public.schema_migrations | Authenticated can read schema_migrations | `authenticated` | SELECT |
| public.cfg_app_notices_categories | Categories: view | `authenticated` | SELECT |
| public.cfg_assets_attributes_groups | Permissive | `` | ALL |
| public.cfg_app_notices_severities | Severities: view | `authenticated` | SELECT |
| public.ai_chat_histories | Universal Access | `` | ALL |
| public.ai_chat_sessions | Universal Access | `` | ALL |
| public.ai_knowledge | Universal Access | `` | ALL |
| public.ai_messages | Universal Access | `` | ALL |
| public.api_keys | Universal Access | `` | ALL |
| public.assets | Universal Access | `` | ALL |
| public.assets_alerts | Universal Access | `` | ALL |
| public.assets_attributes_values | Universal Access | `` | ALL |
| public.assets_available | Universal Access | `` | ALL |
| public.assets_followers | Universal Access | `` | ALL |
| public.assets_materials | Universal Access | `` | ALL |
| public.audits_logs | Universal Access | `` | ALL |
| public.carts_materials | Universal Access | `` | ALL |
| public.cfg_activities | Universal Access | `` | ALL |
| public.cfg_app | Universal Access | `` | ALL |
| public.cfg_app_offline_updates | Universal Access | `` | ALL |
| public.cfg_app_pages | Universal Access | `` | ALL |
| public.cfg_app_versions_update | Universal Access | `` | ALL |
| public.cfg_assets_attributes | Universal Access | `` | ALL |
| public.cfg_assets_available_processing | Universal Access | `` | ALL |
| public.cfg_assets_couplings_models | Universal Access | `` | ALL |
| public.cfg_assets_priorities | Universal Access | `` | ALL |
| public.cfg_assets_statuses | Universal Access | `` | ALL |
| public.cfg_assets_tags | Universal Access | `` | ALL |
| public.cfg_assets_tags_subs | Universal Access | `` | ALL |
| public.cfg_assets_types | Universal Access | `` | ALL |
| public.cfg_assets_types_attributes | Universal Access | `` | ALL |
| public.cfg_assets_unavailable_reasons | Universal Access | `` | ALL |
| public.cfg_companies | Universal Access | `` | ALL |
| ... | (+89) | | |

## Distribuição de policies por comando

| cmd | qtd |
|-----|----:|
| ALL | 109 |
| SELECT | 22 |
| DELETE | 14 |
| INSERT | 14 |
| UPDATE | 13 |

## Principais roles nas policies

| roles | qtd |
|-------|----:|
| `` | 144 |
| `authenticated` | 24 |
| `authenticated, anon` | 4 |




## Triggers (50)

| tabela | trigger | timing | eventos | função |
|--------|---------|--------|---------|--------|
| auth.users | `on_auth_user_created` | AFTER | INSERT | `public.handle_new_user` |
| public.users_notifications | `n8n_whatsappUserNotification` | AFTER | INSERT | `supabase_functions.http_request` |
| public.users | `on_profile_photo_change` | AFTER | UPDATE | `public.handle_profile_photo_change_notification` |
| public.users | `on_user_updated` | BEFORE | UPDATE | `public.handle_updated_at` |
| public.orders_visits_assets | `tgr_after_img_file_name_update` | BEFORE | INSERT OR UPDATE OF after_img_files_names | `public.fc_update_after_img_file_name` |
| public.orders_visits_assets | `tgr_after_img_files_names_update` | BEFORE | INSERT OR UPDATE OF after_img_file_name | `public.fc_update_after_img_files_names` |
| public.assets | `tgr_assets_searchable_update` | BEFORE | INSERT OR UPDATE | `public.fc_assets_searchable_update` |
| public.orders_visits_assets | `tgr_before_img_file_name_update` | BEFORE | INSERT OR UPDATE OF before_img_files_names | `public.fc_update_before_img_file_name` |
| public.orders_visits_assets | `tgr_before_img_files_names_update` | BEFORE | INSERT OR UPDATE OF before_img_file_name | `public.fc_update_before_img_files_names` |
| public.cfg_units_assets_tags | `tgr_cfg_units_assets_tags_set_last_values_when_processing_2` | BEFORE | UPDATE | `public.fc_cfg_units_assets_tags_set_last_values_when_processing_2` |
| public.orders_visits | `tgr_durations_hours_decimals` | BEFORE | INSERT OR UPDATE | `public.fc_durations_hours_decimals` |
| public.materials | `tgr_materials_searchable` | BEFORE | INSERT OR UPDATE | `public.fc_materials_searchable` |
| public.orders | `tgr_orders_sanitize_requested_services` | BEFORE | INSERT OR UPDATE | `public.fc_orders_replace_special_chars` |
| public.orders_visits_assets_activities | `tgr_orders_visits_assets_activities_description` | AFTER | INSERT OR DELETE OR UPDATE | `public.fc_orders_visits_assets_activities_description` |
| public.orders_visits_assets | `tgr_orders_visits_assets_update_activities_searchable` | AFTER | INSERT OR DELETE OR UPDATE | `public.fc_orders_visits_assets_update_activities_searchable` |
| public.orders_visits_services | `tgr_orders_visits_services_amount_update` | BEFORE | INSERT OR UPDATE | `public.fc_orders_visits_services_amount_update` |
| public.units | `tgr_units_searchable` | BEFORE | INSERT OR UPDATE | `public.fc_tgr_units_searchable` |
| public.orders_visits | `trg_audit_visit_costs_status` | AFTER | UPDATE OF ov_costs_status | `public.fn_audit_visit_costs_status` |
| public.cfg_app_notices | `trg_cfg_app_notices_updated_at` | BEFORE | UPDATE | `public.update_cfg_app_notices_updated_at` |
| public.orders | `trg_followers_orders_status_changed` | AFTER | UPDATE OF status_id | `public.handle_followers_orders_status_changed` |
| public.import_orders_visits_contracts | `trg_import_orders_visits_contracts_update_finger_print` | BEFORE | INSERT OR UPDATE | `public.fc_import_orders_visits_contracts_update_finger_print` |
| public.users | `trg_leader_tracker_interval` | BEFORE | UPDATE OF is_ov_in_progress, is_team_leader | `public.fc_leader_tracker_interval` |
| public.orders | `trg_order_status_inheritance` | AFTER | UPDATE OF status_id, status_at | `public.fc_order_status_inheritance` |
| public.orders | `trg_orders_op_counter` | AFTER | INSERT OR DELETE OR UPDATE | `public.fc_orders_op_counter_trigger` |
| public.orders_visits_assets_materials | `trg_orders_visits_assets_materials_update_value_total` | BEFORE | INSERT OR UPDATE | `public.fc_orders_visits_assets_materials_update_value_total` |
| public.orders_visits_assets_materials | `trg_orders_visits_assets_update_materials_value` | AFTER | INSERT OR DELETE OR UPDATE | `public.fc_orders_visits_assets_update_materials_value` |
| public.orders_visits | `trg_orders_visits_assets_update_services_value` | AFTER | UPDATE OF ov_services_value, ov_assets_amount | `public.fc_orders_visits_assets_update_services_value` |
| public.orders_visits | `trg_orders_visits_assets_update_vehicles_value` | AFTER | UPDATE OF ov_vehicles_value, ov_assets_amount | `public.fc_orders_visits_assets_update_vehicles_value` |
| public.orders_visits_services | `trg_orders_visits_services_update_services_value` | AFTER | INSERT OR DELETE OR UPDATE | `public.fc_orders_visits_services_update_services_value` |
| public.orders_visits_services | `trg_orders_visits_services_update_value_unit` | BEFORE | INSERT | `public.fc_orders_visits_services_update_value_unit` |
| public.orders_visits_teams | `trg_orders_visits_teams_update` | AFTER | INSERT OR DELETE | `public.fc_orders_visits_teams_update` |
| public.orders_visits | `trg_orders_visits_update_total_value` | AFTER | UPDATE OF ov_materials_value, ov_services_value, ov_vehicles_value | `public.fc_orders_visits_update_total_value` |
| public.orders_visits_vehicles | `trg_orders_visits_vehicles_before_save` | BEFORE | INSERT OR UPDATE | `public.fc_orders_visits_vehicles_before_save` |
| public.orders_visits_vehicles | `trg_orders_visits_vehicles_update_vehicles_value` | AFTER | INSERT OR DELETE OR UPDATE | `public.fc_orders_visits_vehicles_update_vehicles_value` |
| public.orders_visits | `trg_set_ov_started_date_parts` | BEFORE | INSERT OR UPDATE OF ov_started_at | `public.fc_set_ov_started_date_parts` |
| public.orders_visits | `trg_sync_ov_costs_status` | AFTER | UPDATE OF ov_costs_status | `public.fc_sync_ov_costs_status` |
| public.orders_visits_assets | `trg_total_value_update` | BEFORE | INSERT OR UPDATE | `public.fc_total_value_update` |
| public.cfg_assets_tags | `trg_units_assets_tags_update_asset_tag_description` | AFTER | UPDATE OF description | `public.fc_units_assets_tags_update_asset_tag_description` |
| public.cfg_assets_tags_subs | `trg_units_assets_tags_update_asset_tag_sub_description` | AFTER | UPDATE OF description | `public.fc_units_assets_tags_update_asset_tag_sub_description` |
| public.orders | `trg_units_assets_tags_update_op_counter` | AFTER | INSERT OR UPDATE OF unit_asset_tag_has_order | `public.fc_units_assets_tags_update_op_counter` |
| public.cfg_app_notices | `trigger_update_cfg_app_notices_updated_at` | BEFORE | UPDATE | `public.update_system_notices_updated_at` |
| public.cfg_app_tips | `trigger_update_cfg_app_tips_updated_at` | BEFORE | UPDATE | `public.update_cfg_app_tips_updated_at` |
| public.users | `users_change_updated_at` | BEFORE | UPDATE | `public.change_updated_at` |
| storage.buckets | `enforce_bucket_name_length_trigger` | BEFORE | INSERT OR UPDATE OF name | `storage.enforce_bucket_name_length` |
| storage.objects | `objects_delete_delete_prefix` | AFTER | DELETE | `storage.delete_prefix_hierarchy_trigger` |
| storage.objects | `objects_insert_create_prefix` | BEFORE | INSERT | `storage.objects_insert_prefix_trigger` |
| storage.objects | `objects_update_create_prefix` | BEFORE | UPDATE WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) | `storage.objects_update_prefix_trigger` |
| storage.prefixes | `prefixes_create_hierarchy` | BEFORE | INSERT WHEN ((pg_trigger_depth() < 1)) | `storage.prefixes_insert_trigger` |
| storage.prefixes | `prefixes_delete_hierarchy` | AFTER | DELETE | `storage.delete_prefix_hierarchy_trigger` |
| storage.objects | `update_objects_updated_at` | BEFORE | UPDATE | `storage.update_updated_at_column` |


## Arquivos gerados neste diretório

| arquivo | conteúdo |
|---------|----------|
| `schema_full.sql` | DDL completo (auth + public + storage) |
| `schema_public.sql` | DDL apenas do schema public |
| `toc.txt` | Índice TOC do dump |
| `analise_estrutura.json` | Análise estruturada |
| `list_*.txt` | Listas por categoria |
| `organized/` | DDL separado por tipo de objeto |
| `ANALISE.md` | Este relatório |

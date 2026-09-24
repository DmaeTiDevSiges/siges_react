COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: change_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.shift_start IS 'Horário de início do turno do usuário';


--
-- Name: COLUMN users.shift_end; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.users.shift_end IS 'Horário de término do turno do usuário';


--
-- Name: COLUMN users.tracker_heartbeat_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.users.tracker_heartbeat_at IS 'Liveness signal: updated on every accepted GPS fix (even when the user is stationary and tracker_at is not refreshed). Use to detect dead trackers (NOW() - tracker_heartbeat_at > N min => tracker offline).';


--
-- Name: COLUMN users.tracker_accuracy; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.users.tracker_accuracy IS 'GPS horizontal accuracy in meters of the last accepted position (68% confidence radius).';


--
-- Name: v_orders_visits_extras; Type: VIEW; Schema: public; Owner: supabase_admin
--

COMMENT ON FUNCTION public.fc_leader_tracker_interval() IS 'v1.0.0 - Ajusta tracker_interval_seconds automaticamente para líderes: 30s quando ocupado, 180s quando livre.';


--
-- Name: fc_materials_searchable(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

COMMENT ON FUNCTION public.fc_order_status_inheritance() IS 'v1.3.0 - Sincroniza automaticamente Situação e Data da SS com base no peso (priority_level) das OSs filhas.';


--
-- Name: fc_orders_op_counter_trigger(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

COMMENT ON FUNCTION public.handle_followers_orders_status_changed() IS 'Flow: followers-orders-status-changed v1.4.0 — Notifica os seguidores de uma OS quando sua situação é alterada. Dispara após UPDATE em orders.status_id.';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: ai_chat_histories; Type: TABLE; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_app_notices IS 'Avisos do App - Alertas e comunicados para os usuários';


--
-- Name: COLUMN cfg_app_notices.category_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_notices.category_id IS 'FK para system_notice_categories';


--
-- Name: COLUMN cfg_app_notices.severity_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_notices.severity_id IS 'FK para system_notice_severities';


--
-- Name: COLUMN cfg_app_notices.dashboards; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_notices.dashboards IS 'Array de painéis onde o aviso é visível: dashboard, orders, units';


--
-- Name: cfg_app_notices_categories; Type: TABLE; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_app_notices_categories IS 'Categorias de avisos do app';


--
-- Name: cfg_app_notices_severities; Type: TABLE; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_app_notices_severities IS 'Níveis de severidade dos avisos';


--
-- Name: cfg_app_offline_updates; Type: TABLE; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_app_tips.target_mode IS 'all = all users, filtered = targeted to specific companies/departments/profiles';


--
-- Name: cfg_app_tips_companies; Type: TABLE; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_assets_attributes.select_options IS 'Opções para campos do tipo select (modo inline). Formato JSON: [{"value":"...","label":"..."}]';


--
-- Name: COLUMN cfg_assets_attributes.select_options_group_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_assets_attributes.select_options_group_id IS 'FK para cfg_assets_attributes_groups. Quando preenchido, as opções do select vêm deste grupo.';


--
-- Name: cfg_assets_attributes_groups; Type: TABLE; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.cfg_profiles_access.route_id IS 'Foreign key to cfg_routes - defines which route this permission applies to';


--
-- Name: cfg_profiles_access_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

COMMENT ON TABLE public.cfg_routes IS 'Registry of all available routes/pages in the system for permission management - Updated 2026-01-25';


--
-- Name: cfg_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_status IS 'Status da aprovação financeira: pending (aguardando custos), submitted (custos enviados), approved (aprovado), rejected (rejeitado)';


--
-- Name: COLUMN orders_visits.ov_costs_waiting_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_waiting_at IS 'Data/hora em que os custos foram enviados para aprovação';


--
-- Name: COLUMN orders_visits.ov_costs_waiting_user_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_waiting_user_id IS 'Usuário que enviou os custos para aprovação';


--
-- Name: COLUMN orders_visits.ov_costs_approved_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_approved_at IS 'Data/hora da aprovação financeira';


--
-- Name: COLUMN orders_visits.ov_costs_approved_user_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_approved_user_id IS 'Usuário que aprovou financeiramente';


--
-- Name: COLUMN orders_visits.ov_costs_rejected_at; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_rejected_at IS 'Data/hora da rejeição dos custos';


--
-- Name: COLUMN orders_visits.ov_costs_rejected_user_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_rejected_user_id IS 'Usuário que rejeitou os custos';


--
-- Name: COLUMN orders_visits.ov_costs_rejection_reason; Type: COMMENT; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN public.orders_visits.ov_costs_rejection_reason IS 'Motivo da rejeição dos custos financeiros';


--
-- Name: orders_visits_assets; Type: TABLE; Schema: public; Owner: supabase_admin
--

COMMENT ON VIEW public.v_materials IS 'Catálogo de materiais ativos com status, tipo e resumo de estoque por almoxarifado';


--
-- Name: v_materials_purchases; Type: VIEW; Schema: public; Owner: supabase_admin
--

COMMENT ON VIEW public.v_users_permissions IS 'Consolidated view of user permissions based on their profile and assigned routes';


--
-- Name: v_vehicles; Type: VIEW; Schema: public; Owner: supabase_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

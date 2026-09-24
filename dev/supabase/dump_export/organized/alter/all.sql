ALTER TABLE public.cfg_activities OWNER TO supabase_admin;

--
-- Name: v_activities; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets OWNER TO supabase_admin;

--
-- Name: cfg_assets_couplings_models; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_couplings_models OWNER TO supabase_admin;

--
-- Name: cfg_assets_priorities; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_priorities OWNER TO supabase_admin;

--
-- Name: cfg_assets_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_statuses OWNER TO supabase_admin;

--
-- Name: cfg_assets_tags; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_tags OWNER TO supabase_admin;

--
-- Name: cfg_assets_tags_subs; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_tags_subs OWNER TO supabase_admin;

--
-- Name: cfg_assets_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types OWNER TO supabase_admin;

--
-- Name: cfg_companies; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_companies OWNER TO supabase_admin;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.clients OWNER TO supabase_admin;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials OWNER TO supabase_admin;

--
-- Name: units; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.units OWNER TO supabase_admin;

--
-- Name: v_assets; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_services OWNER TO supabase_admin;

--
-- Name: contracts_services; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_services OWNER TO supabase_admin;

--
-- Name: v_contracts_services; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_causes_reasons OWNER TO supabase_admin;

--
-- Name: cfg_orders_priorities; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_priorities OWNER TO supabase_admin;

--
-- Name: cfg_orders_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types OWNER TO supabase_admin;

--
-- Name: cfg_orders_types_subs; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_subs OWNER TO supabase_admin;

--
-- Name: cfg_orders_visits_extras_processing; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_extras_processing OWNER TO supabase_admin;

--
-- Name: cfg_systems; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_systems OWNER TO supabase_admin;

--
-- Name: cfg_teams; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_teams OWNER TO supabase_admin;

--
-- Name: cfg_units_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_types OWNER TO supabase_admin;

--
-- Name: orders_visits_extras; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras OWNER TO supabase_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users OWNER TO supabase_admin;

--
-- Name: COLUMN users.shift_start; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_cancel_reasons OWNER TO supabase_admin;

--
-- Name: cfg_orders_objects; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_objects OWNER TO supabase_admin;

--
-- Name: cfg_orders_plans; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_plans OWNER TO supabase_admin;

--
-- Name: cfg_orders_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_statuses OWNER TO supabase_admin;

--
-- Name: cfg_orders_suspended_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_suspended_reasons OWNER TO supabase_admin;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts OWNER TO supabase_admin;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders OWNER TO supabase_admin;

--
-- Name: v_orders; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_activities OWNER TO supabase_admin;

--
-- Name: v_orders_types_activities; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals OWNER TO supabase_admin;

--
-- Name: v_technicals_manuals; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_assets_tags OWNER TO supabase_admin;

--
-- Name: v_units_by_assets_tags; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_available_processing OWNER TO supabase_admin;

--
-- Name: cfg_assets_unavailable_reasons; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_unavailable_reasons OWNER TO supabase_admin;

--
-- Name: v_units_assets_tags; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_statuses OWNER TO supabase_admin;

--
-- Name: v_units; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE public.ai_chat_histories OWNER TO supabase_admin;

--
-- Name: ai_chat_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_chat_sessions OWNER TO supabase_admin;

--
-- Name: ai_knowledge; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_knowledge OWNER TO supabase_admin;

--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_messages OWNER TO supabase_admin;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.api_keys OWNER TO supabase_admin;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.api_keys ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.api_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_alerts; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_alerts OWNER TO supabase_admin;

--
-- Name: assets_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_alerts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_alerts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_attributes_values; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_attributes_values OWNER TO supabase_admin;

--
-- Name: assets_available; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_available OWNER TO supabase_admin;

--
-- Name: assets_available_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_available ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_available_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_followers; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_followers OWNER TO supabase_admin;

--
-- Name: assets_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_followers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_followers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: assets_loans; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_loans OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_loans_checklists OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_loans_checklists_images OWNER TO supabase_admin;

--
-- Name: assets_loans_checklists_images_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_materials OWNER TO supabase_admin;

--
-- Name: assets_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.assets_materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: audits_logs; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.audits_logs OWNER TO supabase_admin;

--
-- Name: carts_materials; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.carts_materials OWNER TO supabase_admin;

--
-- Name: carts_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.carts_materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.carts_materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_activities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_app; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app OWNER TO supabase_admin;

--
-- Name: cfg_app_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_app_notices; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices OWNER TO supabase_admin;

--
-- Name: TABLE cfg_app_notices; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices_categories OWNER TO supabase_admin;

--
-- Name: TABLE cfg_app_notices_categories; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices_severities OWNER TO supabase_admin;

--
-- Name: TABLE cfg_app_notices_severities; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_offline_updates OWNER TO supabase_admin;

--
-- Name: cfg_app_offline_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_offline_updates ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_offline_updates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_app_pages; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_pages OWNER TO supabase_admin;

--
-- Name: cfg_app_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_pages ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_pages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_app_tips; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips OWNER TO supabase_admin;

--
-- Name: COLUMN cfg_app_tips.target_mode; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_companies OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_departments OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_dismissals OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_dismissals_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_profiles OWNER TO supabase_admin;

--
-- Name: cfg_app_tips_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_versions_update OWNER TO supabase_admin;

--
-- Name: cfg_app_versions_update_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_versions_update ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_app_versions_update_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_attributes; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_attributes OWNER TO supabase_admin;

--
-- Name: COLUMN cfg_assets_attributes.select_options; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_attributes_groups OWNER TO supabase_admin;

--
-- Name: cfg_assets_attributes_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_attributes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_available_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_available_processing ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_available_processing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_couplings_models_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_couplings_models ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_couplings_models_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_priorities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_priorities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_priorities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_types_attributes; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_attributes OWNER TO supabase_admin;

--
-- Name: cfg_assets_types_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_attributes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_types_attributes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_assets_types_loans_checklists; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_loans_checklists OWNER TO supabase_admin;

--
-- Name: cfg_assets_types_loans_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_unavailable_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_assets_unavailable_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_companies ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_companies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_contracts_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_contracts_statuses OWNER TO supabase_admin;

--
-- Name: cfg_contracts_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_contracts_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_contracts_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_departments; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_departments OWNER TO supabase_admin;

--
-- Name: cfg_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_departments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_departments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_evaluation_requirements; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_evaluation_requirements OWNER TO supabase_admin;

--
-- Name: cfg_evaluation_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_evaluation_requirements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_evaluation_requirements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_loans_checklists; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_loans_checklists OWNER TO supabase_admin;

--
-- Name: cfg_loans_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_statuses OWNER TO supabase_admin;

--
-- Name: cfg_material_purchases_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_cancel_reasons OWNER TO supabase_admin;

--
-- Name: cfg_materials_purchases_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_types OWNER TO supabase_admin;

--
-- Name: cfg_materials_purchases_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_statuses OWNER TO supabase_admin;

--
-- Name: cfg_materials_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_materials_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_materials_types; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_types OWNER TO supabase_admin;

--
-- Name: cfg_materials_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_materials_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_cancel_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_cancel_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_cancel_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_causes_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_causes_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_causes_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_counter; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_counter OWNER TO supabase_admin;

--
-- Name: cfg_orders_counter_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_counter ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_counter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_objects_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_objects ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_objects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_plans ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_priorities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_priorities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_priorities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_suspended_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_suspended_reasons ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_suspended_reasons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_types_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_activities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_types_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_types_subs_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_subs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_types_subs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_visits_extras_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_extras_processing ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_visits_extras_processing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_visits_processing; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_processing OWNER TO supabase_admin;

--
-- Name: cfg_orders_visits_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_processing ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_visits_processing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_orders_visits_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_statuses OWNER TO supabase_admin;

--
-- Name: cfg_orders_visits_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_orders_visits_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_profiles; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles OWNER TO supabase_admin;

--
-- Name: cfg_profiles_access; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_access OWNER TO supabase_admin;

--
-- Name: COLUMN cfg_profiles_access.route_id; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_access ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_profiles_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_profiles_permissions; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_permissions OWNER TO supabase_admin;

--
-- Name: cfg_profiles_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_profiles_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_routes; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_routes OWNER TO supabase_admin;

--
-- Name: TABLE cfg_routes; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_routes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_routes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_services_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_services ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_systems_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_systems ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_systems_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_teams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_technicals_manuals_categories; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_technicals_manuals_categories OWNER TO supabase_admin;

--
-- Name: cfg_technicals_manuals_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_technicals_manuals_categories ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_technicals_manuals_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_units_assets_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_assets_tags ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_units_assets_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_units_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_units_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_units_types_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_units_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cfg_users_statuses; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_users_statuses OWNER TO supabase_admin;

--
-- Name: cfg_users_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_users_statuses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cfg_users_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: chat_agent_ai; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.chat_agent_ai OWNER TO supabase_admin;

--
-- Name: chat_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.chat_agent_ai ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.chat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.clients ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_evaluation_requirements; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_evaluation_requirements OWNER TO supabase_admin;

--
-- Name: contracts_evaluation_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_evaluation_requirements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_evaluation_requirements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_managers; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_managers OWNER TO supabase_admin;

--
-- Name: contracts_managers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_managers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_managers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contracts_services_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_services ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contracts_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.documents OWNER TO supabase_admin;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.extensions OWNER TO supabase_admin;

--
-- Name: goose_db_version; Type: TABLE; Schema: public; Owner: postgres
--

ALTER TABLE public.goose_db_version OWNER TO postgres;

--
-- Name: goose_db_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.goose_db_version ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.goose_db_version_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: impersonation_password_backup; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.impersonation_password_backup OWNER TO supabase_admin;

--
-- Name: impersonation_password_backup_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.import_orders_visits_contracts OWNER TO supabase_admin;

--
-- Name: leader_monthly_scores; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_monthly_scores OWNER TO supabase_admin;

--
-- Name: leader_monthly_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_monthly_scores ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.leader_monthly_scores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: leader_score_badges; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_score_badges OWNER TO supabase_admin;

--
-- Name: leader_score_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_score_badges ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.leader_score_badges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: leader_scores_history; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_scores_history OWNER TO supabase_admin;

--
-- Name: leader_scores_history_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_scores_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.leader_scores_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: logs_api; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.logs_api OWNER TO supabase_admin;

--
-- Name: logs_api_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.logs_api ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.logs_api_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.audits_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: maintenances_plans; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans OWNER TO supabase_admin;

--
-- Name: maintenances_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans_sections OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_activities; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans_sections_activities OWNER TO supabase_admin;

--
-- Name: maintenances_plans_sections_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials_purchases OWNER TO supabase_admin;

--
-- Name: material_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: materials_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials_purchases ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.materials_purchases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: n8n_chat_histories; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.n8n_chat_histories OWNER TO supabase_admin;

--
-- Name: n8n_chat_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_followers OWNER TO supabase_admin;

--
-- Name: orders_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_followers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_followers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_statuses_logs; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_statuses_logs OWNER TO supabase_admin;

--
-- Name: orders_statuses_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_statuses_logs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_statuses_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits OWNER TO supabase_admin;

--
-- Name: COLUMN orders_visits.ov_costs_status; Type: COMMENT; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets OWNER TO supabase_admin;

--
-- Name: orders_visits_assets_activities; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_activities OWNER TO supabase_admin;

--
-- Name: orders_visits_assets_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_activities ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_assets_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_assets_materials; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_materials OWNER TO supabase_admin;

--
-- Name: orders_visits_assets_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_materials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_assets_materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_chat; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat_participants OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat_reads OWNER TO supabase_admin;

--
-- Name: orders_visits_chat_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_evaluations OWNER TO supabase_admin;

--
-- Name: orders_visits_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_evaluations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_evaluations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_extras_followers; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_followers OWNER TO supabase_admin;

--
-- Name: orders_visits_extras_followers_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_followers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_extras_followers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_extras_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_extras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_extras_teams; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_teams OWNER TO supabase_admin;

--
-- Name: orders_visits_extras_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_teams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_extras_teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_services; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_services OWNER TO supabase_admin;

--
-- Name: orders_visits_services_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_services ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_teams; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_teams OWNER TO supabase_admin;

--
-- Name: orders_visits_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_teams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders_visits_vehicles; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_vehicles OWNER TO supabase_admin;

--
-- Name: orders_visits_vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_vehicles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orders_visits_vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.schema_migrations OWNER TO supabase_admin;

--
-- Name: system_notice_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals_assets OWNER TO supabase_admin;

--
-- Name: technicals_manuals_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals_assets ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.technicals_manuals_assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: technicals_manuals_files_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals_files OWNER TO supabase_admin;

--
-- Name: technicals_manuals_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.technicals_manuals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.tenants OWNER TO supabase_admin;

--
-- Name: tmp_contracts_import_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.import_orders_visits_contracts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tmp_contracts_import_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tools; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.tools OWNER TO supabase_admin;

--
-- Name: tools_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.units ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_notifications; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_notifications OWNER TO supabase_admin;

--
-- Name: users_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_notifications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_tools; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tools OWNER TO supabase_admin;

--
-- Name: users_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tools_movements OWNER TO supabase_admin;

--
-- Name: users_tools_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tracker OWNER TO supabase_admin;

--
-- Name: users_tracker_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tracker ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_tracker_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_app; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses OWNER TO supabase_admin;

--
-- Name: warehouses_materials; Type: TABLE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses_materials OWNER TO supabase_admin;

--
-- Name: v_materials; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.vehicles OWNER TO supabase_admin;

--
-- Name: v_orders_visits_vehicles; Type: VIEW; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.vehicles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.warehouses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: warehouses_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase_admin
--

ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: iceberg_namespaces; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_namespaces OWNER TO supabase_storage_admin;

--
-- Name: iceberg_tables; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_tables OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: ai_chat_histories id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_histories ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_histories_id_seq'::regclass);


--
-- Name: assets_loans id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans ALTER COLUMN id SET DEFAULT nextval('public.assets_loans_id_seq'::regclass);


--
-- Name: assets_loans_checklists id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists ALTER COLUMN id SET DEFAULT nextval('public.assets_loans_checklists_id_seq'::regclass);


--
-- Name: assets_loans_checklists_images id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images ALTER COLUMN id SET DEFAULT nextval('public.assets_loans_checklists_images_id_seq'::regclass);


--
-- Name: cfg_app_notices id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices ALTER COLUMN id SET DEFAULT nextval('public.system_notices_id_seq'::regclass);


--
-- Name: cfg_app_notices_categories id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_categories ALTER COLUMN id SET DEFAULT nextval('public.system_notice_categories_id_seq'::regclass);


--
-- Name: cfg_app_notices_severities id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_severities ALTER COLUMN id SET DEFAULT nextval('public.system_notice_severities_id_seq'::regclass);


--
-- Name: cfg_app_tips id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_new_id_seq'::regclass);


--
-- Name: cfg_app_tips_companies id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_companies_id_seq'::regclass);


--
-- Name: cfg_app_tips_departments id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_departments_id_seq'::regclass);


--
-- Name: cfg_app_tips_dismissals id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_dismissals_id_seq'::regclass);


--
-- Name: cfg_app_tips_profiles id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles ALTER COLUMN id SET DEFAULT nextval('public.cfg_app_tips_profiles_id_seq'::regclass);


--
-- Name: cfg_assets_attributes_groups id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes_groups ALTER COLUMN id SET DEFAULT nextval('public.cfg_assets_attributes_groups_id_seq'::regclass);


--
-- Name: cfg_assets_types_loans_checklists id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists ALTER COLUMN id SET DEFAULT nextval('public.cfg_assets_types_loans_checklists_id_seq'::regclass);


--
-- Name: cfg_loans_checklists id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_loans_checklists ALTER COLUMN id SET DEFAULT nextval('public.cfg_loans_checklists_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: impersonation_password_backup id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.impersonation_password_backup ALTER COLUMN id SET DEFAULT nextval('public.impersonation_password_backup_id_seq'::regclass);


--
-- Name: maintenances_plans id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans ALTER COLUMN id SET DEFAULT nextval('public.maintenances_plans_id_seq'::regclass);


--
-- Name: maintenances_plans_sections id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections ALTER COLUMN id SET DEFAULT nextval('public.maintenances_plans_sections_id_seq'::regclass);


--
-- Name: maintenances_plans_sections_activities id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities ALTER COLUMN id SET DEFAULT nextval('public.maintenances_plans_sections_activities_id_seq'::regclass);


--
-- Name: n8n_chat_histories id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.n8n_chat_histories ALTER COLUMN id SET DEFAULT nextval('public.n8n_chat_histories_id_seq'::regclass);


--
-- Name: orders_visits_chat id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat ALTER COLUMN id SET DEFAULT nextval('public.orders_visits_chat_id_seq'::regclass);


--
-- Name: orders_visits_chat_participants id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants ALTER COLUMN id SET DEFAULT nextval('public.orders_visits_chat_participants_id_seq'::regclass);


--
-- Name: orders_visits_chat_reads id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads ALTER COLUMN id SET DEFAULT nextval('public.orders_visits_chat_reads_id_seq'::regclass);


--
-- Name: tools id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools ALTER COLUMN id SET DEFAULT nextval('public.tools_id_seq'::regclass);


--
-- Name: users_tools id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools ALTER COLUMN id SET DEFAULT nextval('public.users_tools_id_seq'::regclass);


--
-- Name: users_tools_movements id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements ALTER COLUMN id SET DEFAULT nextval('public.users_tools_movements_id_seq'::regclass);


--
-- Name: warehouses_materials id; Type: DEFAULT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials ALTER COLUMN id SET DEFAULT nextval('public.warehouses_materials_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_histories ai_chat_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_histories
    ADD CONSTRAINT ai_chat_histories_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: ai_knowledge ai_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_knowledge
    ADD CONSTRAINT ai_knowledge_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_api_key_key UNIQUE (api_key);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: cfg_app app_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app
    ADD CONSTRAINT app_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_pages apppages_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_pages
    ADD CONSTRAINT apppages_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_versions_update appversionsupdate_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_versions_update
    ADD CONSTRAINT appversionsupdate_pkey PRIMARY KEY (id);


--
-- Name: assets_alerts assets_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_attributes assets_attributes_field_key_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT assets_attributes_field_key_unique UNIQUE (field_key);


--
-- Name: cfg_assets_attributes assets_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT assets_attributes_pkey PRIMARY KEY (id);


--
-- Name: assets_attributes_values assets_attributes_values_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_attributes_values
    ADD CONSTRAINT assets_attributes_values_pkey PRIMARY KEY (asset_id, field_key);


--
-- Name: assets_loans_checklists_images assets_loans_checklists_images_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images
    ADD CONSTRAINT assets_loans_checklists_images_pkey PRIMARY KEY (id);


--
-- Name: assets_loans_checklists assets_loans_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_pkey PRIMARY KEY (id);


--
-- Name: assets_loans assets_loans_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_tags assets_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_tags
    ADD CONSTRAINT assets_tags_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_types_attributes assets_types_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT assets_types_attributes_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_types_attributes assets_types_attributes_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT assets_types_attributes_unique UNIQUE (asset_type_id, attribute_id);


--
-- Name: cfg_assets_types assets_types_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types
    ADD CONSTRAINT assets_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_couplings_models assetscouplingsmodels_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_couplings_models
    ADD CONSTRAINT assetscouplingsmodels_pkey PRIMARY KEY (id);


--
-- Name: assets_followers assetsfollowers_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_followers
    ADD CONSTRAINT assetsfollowers_pkey PRIMARY KEY (id);


--
-- Name: assets_materials assetsmaterials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_materials
    ADD CONSTRAINT assetsmaterials_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_priorities assetspriorities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_priorities
    ADD CONSTRAINT assetspriorities_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_statuses assetsstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_statuses
    ADD CONSTRAINT assetsstatuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_tags_subs assetstagssubs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_tags_subs
    ADD CONSTRAINT assetstagssubs_pkey PRIMARY KEY (id);


--
-- Name: carts_materials cart_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.carts_materials
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- Name: cfg_activities cfg_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_activities
    ADD CONSTRAINT cfg_activities_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_notices cfg_app_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT cfg_app_notices_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_offline_updates cfg_app_offline_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_offline_updates
    ADD CONSTRAINT cfg_app_offline_tables_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_tip_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_tip_id_company_id_key UNIQUE (tip_id, company_id);


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_tip_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_tip_id_department_id_key UNIQUE (tip_id, department_id);


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_tip_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_tip_id_user_id_key UNIQUE (tip_id, user_id);


--
-- Name: cfg_app_tips cfg_app_tips_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips
    ADD CONSTRAINT cfg_app_tips_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_tip_id_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_tip_id_profile_id_key UNIQUE (tip_id, profile_id);


--
-- Name: cfg_assets_attributes_groups cfg_assets_attributes_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes_groups
    ADD CONSTRAINT cfg_assets_attributes_groups_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_available_processing cfg_assets_available_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_available_processing
    ADD CONSTRAINT cfg_assets_available_processing_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklist_checklist_id_asset_type_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklist_checklist_id_asset_type_id_key UNIQUE (checklist_id, asset_type_id);


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklists_pkey PRIMARY KEY (id);


--
-- Name: cfg_assets_unavailable_reasons cfg_assets_unavailable_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_unavailable_reasons
    ADD CONSTRAINT cfg_assets_unavailable_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_visits_extras_processing cfg_eap_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_visits_extras_processing
    ADD CONSTRAINT cfg_eap_processing_pkey PRIMARY KEY (id);


--
-- Name: cfg_evaluation_requirements cfg_evaluation_requirements_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_evaluation_requirements
    ADD CONSTRAINT cfg_evaluation_requirements_code_key UNIQUE (code);


--
-- Name: cfg_evaluation_requirements cfg_evaluation_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_evaluation_requirements
    ADD CONSTRAINT cfg_evaluation_requirements_pkey PRIMARY KEY (id);


--
-- Name: cfg_loans_checklists cfg_loans_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_loans_checklists
    ADD CONSTRAINT cfg_loans_checklists_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_purchases_statuses cfg_material_purchases_statuses_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_statuses
    ADD CONSTRAINT cfg_material_purchases_statuses_code_key UNIQUE (code);


--
-- Name: cfg_materials_purchases_statuses cfg_material_purchases_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_statuses
    ADD CONSTRAINT cfg_material_purchases_statuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_purchases_cancel_reasons cfg_materials_purchases_cancel_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_cancel_reasons
    ADD CONSTRAINT cfg_materials_purchases_cancel_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_purchases_types cfg_materials_purchases_types_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_types
    ADD CONSTRAINT cfg_materials_purchases_types_code_key UNIQUE (code);


--
-- Name: cfg_materials_purchases_types cfg_materials_purchases_types_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_purchases_types
    ADD CONSTRAINT cfg_materials_purchases_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_statuses cfg_materials_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_statuses
    ADD CONSTRAINT cfg_materials_statuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_materials_types cfg_materials_types_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_materials_types
    ADD CONSTRAINT cfg_materials_types_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_suspended_reasons cfg_orders_suspended_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_suspended_reasons
    ADD CONSTRAINT cfg_orders_suspended_reasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_access cfg_profiles_access_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT cfg_profiles_access_pkey PRIMARY KEY (id);


--
-- Name: cfg_routes cfg_routes_route_key_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT cfg_routes_route_key_key UNIQUE (route_key);


--
-- Name: cfg_services cfg_services_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_services
    ADD CONSTRAINT cfg_services_pkey PRIMARY KEY (id);


--
-- Name: cfg_technicals_manuals_categories cfg_technicals_manuals_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_technicals_manuals_categories
    ADD CONSTRAINT cfg_technicals_manuals_categories_pkey PRIMARY KEY (id);


--
-- Name: chat_agent_ai chat_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.chat_agent_ai
    ADD CONSTRAINT chat_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: cfg_companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_contract_evaluation_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_contract_evaluation_unique UNIQUE (contract_id, evaluation_id);


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: contracts_managers contractsmanagers_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contractsmanagers_pkey PRIMARY KEY (id);


--
-- Name: contracts_services contractsservices_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_services
    ADD CONSTRAINT contractsservices_pkey PRIMARY KEY (id);


--
-- Name: cfg_contracts_statuses contractsstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_contracts_statuses
    ADD CONSTRAINT contractsstatuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_departments department_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_departments
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: goose_db_version goose_db_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goose_db_version
    ADD CONSTRAINT goose_db_version_pkey PRIMARY KEY (id);


--
-- Name: impersonation_password_backup impersonation_password_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.impersonation_password_backup
    ADD CONSTRAINT impersonation_password_backup_pkey PRIMARY KEY (id);


--
-- Name: leader_monthly_scores leader_monthly_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_pkey PRIMARY KEY (id);


--
-- Name: leader_monthly_scores leader_monthly_scores_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_unique UNIQUE (leader_id, score_year, score_month);


--
-- Name: leader_score_badges leader_score_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_score_badges
    ADD CONSTRAINT leader_score_badges_pkey PRIMARY KEY (id);


--
-- Name: leader_scores_history leader_scores_history_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_pkey PRIMARY KEY (id);


--
-- Name: leader_scores_history leader_scores_history_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_unique UNIQUE (ov_id);


--
-- Name: logs_api logs_api_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.logs_api
    ADD CONSTRAINT logs_api_pkey PRIMARY KEY (id);


--
-- Name: audits_logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.audits_logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: maintenances_plans maintenances_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans
    ADD CONSTRAINT maintenances_plans_pkey PRIMARY KEY (id);


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_a_maintenance_plan_section_id_a_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_a_maintenance_plan_section_id_a_key UNIQUE (maintenance_plan_section_id, activity_id);


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_activities_pkey PRIMARY KEY (id);


--
-- Name: maintenances_plans_sections maintenances_plans_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections
    ADD CONSTRAINT maintenances_plans_sections_pkey PRIMARY KEY (id);


--
-- Name: materials_purchases material_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT material_purchases_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: n8n_chat_histories n8n_chat_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.n8n_chat_histories
    ADD CONSTRAINT n8n_chat_histories_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_counter orders_counter_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_counter
    ADD CONSTRAINT orders_counter_pkey PRIMARY KEY (id);


--
-- Name: orders_followers orders_followers_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_followers
    ADD CONSTRAINT orders_followers_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_visits_statuses orders_visitis_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_visits_statuses
    ADD CONSTRAINT orders_visitis_statuses_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets_activities orders_visits_assets_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets_activities
    ADD CONSTRAINT orders_visits_assets_activities_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets orders_visits_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_ov_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_ov_id_user_id_key UNIQUE (ov_id, user_id);


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_chat orders_visits_chat_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat
    ADD CONSTRAINT orders_visits_chat_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_chat_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_chat_id_user_id_key UNIQUE (chat_id, user_id);


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_evaluations orders_visits_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_extras orders_visits_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_extras_teams orders_visits_extras_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_teams
    ADD CONSTRAINT orders_visits_extras_teams_pkey PRIMARY KEY (id);


--
-- Name: orders_visits orders_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_visits_processing orders_visits_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_visits_processing
    ADD CONSTRAINT orders_visits_processing_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_teams orders_visits_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_teams
    ADD CONSTRAINT orders_visits_teams_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_cancel_reasons orderscancelreasons_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_cancel_reasons
    ADD CONSTRAINT orderscancelreasons_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_causes_reasons orderscauses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_causes_reasons
    ADD CONSTRAINT orderscauses_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_objects ordersobjects_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_objects
    ADD CONSTRAINT ordersobjects_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_plans ordersplans_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_plans
    ADD CONSTRAINT ordersplans_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_priorities orderspriorities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_priorities
    ADD CONSTRAINT orderspriorities_pkey PRIMARY KEY (id);


--
-- Name: orders_statuses_logs ordersstatuseslogs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_statuses_logs
    ADD CONSTRAINT ordersstatuseslogs_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_statuses ordersstatusess_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_statuses
    ADD CONSTRAINT ordersstatusess_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types orderstypes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_types
    ADD CONSTRAINT orderstypes_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types_activities orderstypesactivities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_types_activities
    ADD CONSTRAINT orderstypesactivities_pkey PRIMARY KEY (id);


--
-- Name: cfg_orders_types_subs orderstypessubs_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_orders_types_subs
    ADD CONSTRAINT orderstypessubs_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets_materials ordersvisitsassetsmaterials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets_materials
    ADD CONSTRAINT ordersvisitsassetsmaterials_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_services ordersvisitsservices_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_services
    ADD CONSTRAINT ordersvisitsservices_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_vehicles ordersvisitsvehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_vehicles
    ADD CONSTRAINT ordersvisitsvehicles_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_access profiles_access_unique; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_unique UNIQUE (profile_id, route_id);


--
-- Name: cfg_routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: cfg_app_notices_categories system_notice_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_categories
    ADD CONSTRAINT system_notice_categories_code_key UNIQUE (code);


--
-- Name: cfg_app_notices_categories system_notice_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_categories
    ADD CONSTRAINT system_notice_categories_pkey PRIMARY KEY (id);


--
-- Name: cfg_app_notices_severities system_notice_severities_code_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_severities
    ADD CONSTRAINT system_notice_severities_code_key UNIQUE (code);


--
-- Name: cfg_app_notices_severities system_notice_severities_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices_severities
    ADD CONSTRAINT system_notice_severities_pkey PRIMARY KEY (id);


--
-- Name: cfg_systems systems_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_systems
    ADD CONSTRAINT systems_pkey PRIMARY KEY (id);


--
-- Name: cfg_teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: technicals_manuals_files technicals_manuals_files_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_pkey PRIMARY KEY (id);


--
-- Name: technicals_manuals technicals_manuals_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals
    ADD CONSTRAINT technicals_manuals_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: import_orders_visits_contracts tmp_contracts_import_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.import_orders_visits_contracts
    ADD CONSTRAINT tmp_contracts_import_pkey PRIMARY KEY (id);


--
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);


--
-- Name: orders_visits_assets unique_ov_asset; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT unique_ov_asset UNIQUE (ov_id, asset_id);


--
-- Name: assets_available units_assets_available_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT units_assets_available_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_assets_tags units_assets_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT units_assets_tags_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_statuses unitsstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_statuses
    ADD CONSTRAINT unitsstatuses_pkey PRIMARY KEY (id);


--
-- Name: cfg_units_types unitstypes_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_types
    ADD CONSTRAINT unitstypes_pkey PRIMARY KEY (id);


--
-- Name: users_notifications users_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_tools_movements users_tools_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_pkey PRIMARY KEY (id);


--
-- Name: users_tools users_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles usersprofiles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles
    ADD CONSTRAINT usersprofiles_pkey PRIMARY KEY (id);


--
-- Name: cfg_profiles_permissions usersprofilespermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_permissions
    ADD CONSTRAINT usersprofilespermissions_pkey PRIMARY KEY (id);


--
-- Name: cfg_users_statuses usersstatuses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_users_statuses
    ADD CONSTRAINT usersstatuses_pkey PRIMARY KEY (id);


--
-- Name: users_tracker userstracks_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tracker
    ADD CONSTRAINT userstracks_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: warehouses_materials warehouses_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_pkey PRIMARY KEY (id);


--
-- Name: warehouses_materials warehouses_materials_warehouse_id_material_id_key; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_warehouse_id_material_id_key UNIQUE (warehouse_id, material_id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: iceberg_namespaces iceberg_namespaces_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_pkey PRIMARY KEY (id);


--
-- Name: iceberg_tables iceberg_tables_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: ai_chat_sessions ai_chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_messages ai_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;


--
-- Name: assets_alerts assets_alerts_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: assets_alerts assets_alerts_o_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_o_type_id_fkey FOREIGN KEY (o_type_id) REFERENCES public.cfg_orders_types(id) ON DELETE SET NULL;


--
-- Name: assets_alerts assets_alerts_ova_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_ova_id_fkey FOREIGN KEY (ova_id) REFERENCES public.orders_visits_assets(id);


--
-- Name: assets_alerts assets_alerts_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT assets_alerts_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.cfg_orders_priorities(id) ON DELETE SET NULL;


--
-- Name: assets_available assets_available_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT assets_available_asset_tag_id_fkey FOREIGN KEY (asset_tag_id) REFERENCES public.cfg_assets_tags(id);


--
-- Name: assets_available assets_available_asset_tag_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT assets_available_asset_tag_sub_id_fkey FOREIGN KEY (asset_tag_sub_id) REFERENCES public.cfg_assets_tags_subs(id);


--
-- Name: assets_available assets_available_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_available
    ADD CONSTRAINT assets_available_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: assets assets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON UPDATE CASCADE;


--
-- Name: assets assets_company_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_company_owner_id_fkey FOREIGN KEY (company_owner_id) REFERENCES public.cfg_companies(id);


--
-- Name: assets_loans assets_loans_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: assets_loans_checklists assets_loans_checklists_filled_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_filled_by_user_id_fkey FOREIGN KEY (filled_by_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans_checklists_images assets_loans_checklists_images_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images
    ADD CONSTRAINT assets_loans_checklists_images_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.assets_loans_checklists(id) ON DELETE CASCADE;


--
-- Name: assets_loans_checklists_images assets_loans_checklists_images_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists_images
    ADD CONSTRAINT assets_loans_checklists_images_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans_checklists assets_loans_checklists_loan_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_loan_checklist_id_fkey FOREIGN KEY (loan_checklist_id) REFERENCES public.cfg_loans_checklists(id) ON DELETE SET NULL;


--
-- Name: assets_loans_checklists assets_loans_checklists_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans_checklists
    ADD CONSTRAINT assets_loans_checklists_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.assets_loans(id) ON DELETE CASCADE;


--
-- Name: assets_loans assets_loans_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_inspector_delivery_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_inspector_delivery_user_id_fkey FOREIGN KEY (inspector_delivery_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_inspector_return_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_inspector_return_user_id_fkey FOREIGN KEY (inspector_return_user_id) REFERENCES public.users(id);


--
-- Name: assets_loans assets_loans_lender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_loans
    ADD CONSTRAINT assets_loans_lender_user_id_fkey FOREIGN KEY (lender_user_id) REFERENCES public.users(id);


--
-- Name: assets assets_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: assets assets_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.cfg_assets_types(id);


--
-- Name: assets assets_unit_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_unit_asset_tag_id_fkey FOREIGN KEY (unit_asset_tag_id) REFERENCES public.cfg_units_assets_tags(id);


--
-- Name: assets assets_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: cfg_app_notices cfg_app_notices_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT cfg_app_notices_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.cfg_companies(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_companies cfg_app_tips_companies_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_companies
    ADD CONSTRAINT cfg_app_tips_companies_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips cfg_app_tips_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips
    ADD CONSTRAINT cfg_app_tips_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_departments cfg_app_tips_departments_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_departments
    ADD CONSTRAINT cfg_app_tips_departments_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_dismissals cfg_app_tips_dismissals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_dismissals
    ADD CONSTRAINT cfg_app_tips_dismissals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE CASCADE;


--
-- Name: cfg_app_tips_profiles cfg_app_tips_profiles_tip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_tips_profiles
    ADD CONSTRAINT cfg_app_tips_profiles_tip_id_fkey FOREIGN KEY (tip_id) REFERENCES public.cfg_app_tips(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_attributes cfg_assets_attributes_select_options_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_attributes
    ADD CONSTRAINT cfg_assets_attributes_select_options_group_id_fkey FOREIGN KEY (select_options_group_id) REFERENCES public.cfg_assets_attributes_groups(id) ON DELETE SET NULL;


--
-- Name: cfg_assets_types_attributes cfg_assets_types_attributes_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT cfg_assets_types_attributes_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.cfg_assets_types(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_types_attributes cfg_assets_types_attributes_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_attributes
    ADD CONSTRAINT cfg_assets_types_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.cfg_assets_attributes(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklists_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklists_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.cfg_assets_types(id) ON DELETE CASCADE;


--
-- Name: cfg_assets_types_loans_checklists cfg_assets_types_loans_checklists_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_assets_types_loans_checklists
    ADD CONSTRAINT cfg_assets_types_loans_checklists_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.cfg_loans_checklists(id) ON DELETE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_asset_tag_id_fkey FOREIGN KEY (asset_tag_id) REFERENCES public.cfg_assets_tags(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_asset_tag_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_asset_tag_sub_id_fkey FOREIGN KEY (asset_tag_sub_id) REFERENCES public.cfg_assets_tags_subs(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_created_user_id_fkey FOREIGN KEY (last_created_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_processing_id_fkey FOREIGN KEY (last_processing_id) REFERENCES public.cfg_assets_available_processing(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_reported_user_id_fkey FOREIGN KEY (last_reported_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_last_reported_user_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_last_reported_user_id_fkey1 FOREIGN KEY (last_reported_user_id) REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: cfg_units_assets_tags cfg_units_assets_tags_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON UPDATE CASCADE;


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contracts_evaluation_requirements contracts_evaluation_requirements_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_evaluation_requirements
    ADD CONSTRAINT contracts_evaluation_requirements_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.cfg_evaluation_requirements(id) ON DELETE CASCADE;


--
-- Name: contracts_managers contracts_managers_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.contracts_managers
    ADD CONSTRAINT contracts_managers_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES public.tenants(external_id) ON DELETE CASCADE;


--
-- Name: assets_alerts fk_assets_alerts_order; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.assets_alerts
    ADD CONSTRAINT fk_assets_alerts_order FOREIGN KEY (o_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: materials_purchases fk_materials_purchases_cancel_reason; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.materials_purchases
    ADD CONSTRAINT fk_materials_purchases_cancel_reason FOREIGN KEY (cancel_reason_id) REFERENCES public.cfg_materials_purchases_cancel_reasons(id) ON DELETE SET NULL;


--
-- Name: leader_monthly_scores leader_monthly_scores_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON DELETE CASCADE;


--
-- Name: leader_monthly_scores leader_monthly_scores_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_monthly_scores
    ADD CONSTRAINT leader_monthly_scores_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leader_score_badges leader_score_badges_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_score_badges
    ADD CONSTRAINT leader_score_badges_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leader_scores_history leader_scores_history_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leader_scores_history leader_scores_history_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.leader_scores_history
    ADD CONSTRAINT leader_scores_history_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_ac_maintenance_plan_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_ac_maintenance_plan_section_id_fkey FOREIGN KEY (maintenance_plan_section_id) REFERENCES public.maintenances_plans_sections(id) ON DELETE CASCADE;


--
-- Name: maintenances_plans_sections_activities maintenances_plans_sections_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections_activities
    ADD CONSTRAINT maintenances_plans_sections_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.cfg_activities(id) ON DELETE CASCADE;


--
-- Name: maintenances_plans_sections maintenances_plans_sections_maintenance_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.maintenances_plans_sections
    ADD CONSTRAINT maintenances_plans_sections_maintenance_plan_id_fkey FOREIGN KEY (maintenance_plan_id) REFERENCES public.maintenances_plans(id) ON DELETE CASCADE;


--
-- Name: orders orders_cancel_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cancel_reason_id_fkey FOREIGN KEY (cancel_reason_id) REFERENCES public.cfg_orders_cancel_reasons(id) ON UPDATE CASCADE;


--
-- Name: orders orders_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_object_id_fkey FOREIGN KEY (object_id) REFERENCES public.cfg_orders_objects(id);


--
-- Name: orders orders_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.cfg_orders_types(id) ON UPDATE CASCADE;


--
-- Name: orders orders_type_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_type_sub_id_fkey FOREIGN KEY (type_sub_id) REFERENCES public.cfg_orders_types_subs(id) ON UPDATE CASCADE;


--
-- Name: orders_visits_assets_activities orders_visits_assets_activities_maintenance_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets_activities
    ADD CONSTRAINT orders_visits_assets_activities_maintenance_plan_id_fkey FOREIGN KEY (maintenance_plan_id) REFERENCES public.maintenances_plans(id);


--
-- Name: orders_visits_assets orders_visits_assets_after_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_after_unit_id_fkey FOREIGN KEY (after_unit_id) REFERENCES public.units(id);


--
-- Name: orders_visits_assets orders_visits_assets_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: orders_visits_assets orders_visits_assets_before_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_before_unit_id_fkey FOREIGN KEY (before_unit_id) REFERENCES public.units(id);


--
-- Name: orders_visits_assets orders_visits_assets_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id);


--
-- Name: orders_visits_assets orders_visits_assets_ov_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_assets
    ADD CONSTRAINT orders_visits_assets_ov_id_fkey1 FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id);


--
-- Name: orders_visits orders_visits_chat_closed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_chat_closed_user_id_fkey FOREIGN KEY (chat_closed_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits orders_visits_chat_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_chat_created_user_id_fkey FOREIGN KEY (chat_created_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_chat orders_visits_chat_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat
    ADD CONSTRAINT orders_visits_chat_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: orders_visits_chat_participants orders_visits_chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_participants
    ADD CONSTRAINT orders_visits_chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.orders_visits_chat(id) ON DELETE CASCADE;


--
-- Name: orders_visits_chat_reads orders_visits_chat_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat_reads
    ADD CONSTRAINT orders_visits_chat_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_chat orders_visits_chat_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_chat
    ADD CONSTRAINT orders_visits_chat_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_evaluations orders_visits_evaluations_contract_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_contract_evaluation_id_fkey FOREIGN KEY (contract_evaluation_id) REFERENCES public.contracts_evaluation_requirements(id) ON DELETE CASCADE;


--
-- Name: orders_visits_evaluations orders_visits_evaluations_evaluated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_evaluated_by_user_id_fkey FOREIGN KEY (evaluated_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: orders_visits_evaluations orders_visits_evaluations_ov_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_evaluations
    ADD CONSTRAINT orders_visits_evaluations_ov_id_fkey FOREIGN KEY (ov_id) REFERENCES public.orders_visits(id) ON DELETE CASCADE;


--
-- Name: orders_visits_extras orders_visits_extras_asset_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_asset_tag_id_fkey FOREIGN KEY (asset_tag_id) REFERENCES public.cfg_assets_tags(id);


--
-- Name: orders_visits_extras_followers orders_visits_extras_followers_ove_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_followers
    ADD CONSTRAINT orders_visits_extras_followers_ove_id_fkey FOREIGN KEY (ove_id) REFERENCES public.orders_visits_extras(id);


--
-- Name: orders_visits_extras_followers orders_visits_extras_followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_followers
    ADD CONSTRAINT orders_visits_extras_followers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_extras orders_visits_extras_o_cause_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_o_cause_reason_id_fkey FOREIGN KEY (o_cause_reason_id) REFERENCES public.cfg_orders_causes_reasons(id);


--
-- Name: orders_visits_extras orders_visits_extras_o_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_o_type_id_fkey FOREIGN KEY (o_type_id) REFERENCES public.cfg_orders_types(id);


--
-- Name: orders_visits_extras orders_visits_extras_o_type_sub_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_o_type_sub_id_fkey FOREIGN KEY (o_type_sub_id) REFERENCES public.cfg_orders_types_subs(id);


--
-- Name: orders_visits_extras orders_visits_extras_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.cfg_orders_priorities(id);


--
-- Name: orders_visits_extras orders_visits_extras_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_processing_id_fkey FOREIGN KEY (processing_id) REFERENCES public.cfg_orders_visits_extras_processing(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_id_fkey1 FOREIGN KEY (system_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_parent_id_fkey FOREIGN KEY (system_parent_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_system_parent_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_system_parent_id_fkey1 FOREIGN KEY (system_parent_id) REFERENCES public.cfg_systems(id);


--
-- Name: orders_visits_extras orders_visits_extras_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.cfg_teams(id);


--
-- Name: orders_visits_extras orders_visits_extras_team_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_team_leader_id_fkey FOREIGN KEY (team_leader_id) REFERENCES public.users(id);


--
-- Name: orders_visits_extras_teams orders_visits_extras_teams_ove_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_teams
    ADD CONSTRAINT orders_visits_extras_teams_ove_id_fkey FOREIGN KEY (ove_id) REFERENCES public.orders_visits_extras(id);


--
-- Name: orders_visits_extras_teams orders_visits_extras_teams_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras_teams
    ADD CONSTRAINT orders_visits_extras_teams_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_extras orders_visits_extras_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: orders_visits_extras orders_visits_extras_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.cfg_units_types(id);


--
-- Name: orders_visits_extras orders_visits_extras_unit_type_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_extras
    ADD CONSTRAINT orders_visits_extras_unit_type_parent_id_fkey FOREIGN KEY (unit_type_parent_id) REFERENCES public.cfg_units_types(id);


--
-- Name: orders_visits orders_visits_ov_costs_approved_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_ov_costs_approved_user_id_fkey FOREIGN KEY (ov_costs_approved_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits orders_visits_ov_costs_rejected_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_ov_costs_rejected_user_id_fkey FOREIGN KEY (ov_costs_rejected_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits orders_visits_ov_costs_submitted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits
    ADD CONSTRAINT orders_visits_ov_costs_submitted_user_id_fkey FOREIGN KEY (ov_costs_waiting_user_id) REFERENCES public.users(id);


--
-- Name: orders_visits_vehicles orders_visits_vehicles_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.orders_visits_vehicles
    ADD CONSTRAINT orders_visits_vehicles_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles_access profiles_access_profile_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_profile_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles_access profiles_access_route_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles_access
    ADD CONSTRAINT profiles_access_route_fkey FOREIGN KEY (route_id) REFERENCES public.cfg_routes(id) ON DELETE CASCADE;


--
-- Name: cfg_profiles public_usersprofiles_departmentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_profiles
    ADD CONSTRAINT public_usersprofiles_departmentid_fkey FOREIGN KEY (department_id) REFERENCES public.cfg_departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cfg_routes routes_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_routes
    ADD CONSTRAINT routes_parent_fkey FOREIGN KEY (parent_id) REFERENCES public.cfg_routes(id) ON DELETE SET NULL;


--
-- Name: cfg_app_notices system_notices_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT system_notices_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.cfg_app_notices_categories(id) ON DELETE RESTRICT;


--
-- Name: cfg_app_notices system_notices_severity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.cfg_app_notices
    ADD CONSTRAINT system_notices_severity_id_fkey FOREIGN KEY (severity_id) REFERENCES public.cfg_app_notices_severities(id) ON DELETE RESTRICT;


--
-- Name: technicals_manuals_files technicals_manuals_files_tm_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_tm_category_id_fkey FOREIGN KEY (tm_category_id) REFERENCES public.cfg_technicals_manuals_categories(id) ON DELETE SET NULL;


--
-- Name: technicals_manuals_files technicals_manuals_files_tm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.technicals_manuals_files
    ADD CONSTRAINT technicals_manuals_files_tm_id_fkey FOREIGN KEY (tm_id) REFERENCES public.technicals_manuals(id) ON DELETE CASCADE;


--
-- Name: tools tools_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tools tools_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tools tools_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL;


--
-- Name: tools tools_updated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_updated_user_id_fkey FOREIGN KEY (updated_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: units units_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.cfg_units_types(id) ON DELETE CASCADE;


--
-- Name: users_notifications users_notifications_user_id_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_user_id_from_fkey FOREIGN KEY (user_id_from) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_notifications users_notifications_user_id_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_notifications
    ADD CONSTRAINT users_notifications_user_id_to_fkey FOREIGN KEY (user_id_to) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.cfg_profiles(id) ON DELETE SET NULL;


--
-- Name: users users_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.cfg_users_statuses(id) ON DELETE CASCADE;


--
-- Name: users users_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.cfg_teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_tools users_tools_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_created_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_created_user_id_fkey FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users_tools_movements users_tools_movements_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools_movements
    ADD CONSTRAINT users_tools_movements_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: users_tools users_tools_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;


--
-- Name: users_tools users_tools_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.users_tools
    ADD CONSTRAINT users_tools_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: warehouses_materials warehouses_materials_deleted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_deleted_user_id_fkey FOREIGN KEY (deleted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: warehouses_materials warehouses_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: warehouses_materials warehouses_materials_updated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_updated_user_id_fkey FOREIGN KEY (updated_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: warehouses_materials warehouses_materials_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY public.warehouses_materials
    ADD CONSTRAINT warehouses_materials_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: iceberg_namespaces iceberg_namespaces_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_namespace_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_namespace_id_fkey FOREIGN KEY (namespace_id) REFERENCES storage.iceberg_namespaces(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_dismissals Admins can delete dismissals; Type: POLICY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_chat_histories ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_chat_sessions; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_knowledge; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_alerts; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_attributes_values; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_attributes_values ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_available; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_available ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_followers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_loans; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_loans ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_loans_checklists_images; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_loans_checklists_images ENABLE ROW LEVEL SECURITY;

--
-- Name: assets_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.assets_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: audits_logs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.audits_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: carts_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.carts_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_notices; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_notices_categories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_notices_severities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_notices_severities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_offline_updates; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_offline_updates ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_pages; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_companies; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_departments; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_departments ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_dismissals; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_dismissals ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_tips_profiles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_tips_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_app_versions_update; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_app_versions_update ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_attributes; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_attributes_groups; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_attributes_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_available_processing; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_available_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_couplings_models; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_couplings_models ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_priorities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_tags; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_tags_subs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_tags_subs ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_types_attributes; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_types_loans_checklists; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_types_loans_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_assets_unavailable_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_assets_unavailable_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_companies; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_contracts_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_contracts_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_departments; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_departments ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_evaluation_requirements; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_evaluation_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_loans_checklists; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_loans_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_purchases_cancel_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_cancel_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_purchases_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_purchases_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_purchases_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_materials_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_materials_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_cancel_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_cancel_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_causes_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_causes_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_counter; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_counter ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_objects; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_objects ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_plans; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_priorities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_suspended_reasons; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_suspended_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_types_subs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_types_subs ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_visits_extras_processing; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_extras_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_visits_processing; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_orders_visits_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_orders_visits_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles_access; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_access ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_profiles_permissions; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_profiles_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_routes; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_routes ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_services; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_services ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_systems; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_systems ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_teams; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_technicals_manuals_categories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_technicals_manuals_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_assets_tags; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_assets_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_units_types; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_units_types ENABLE ROW LEVEL SECURITY;

--
-- Name: cfg_users_statuses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.cfg_users_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_agent_ai; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.chat_agent_ai ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts_evaluation_requirements; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_evaluation_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts_managers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_managers ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts_services; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.contracts_services ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: extensions; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

--
-- Name: goose_db_version; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.goose_db_version ENABLE ROW LEVEL SECURITY;

--
-- Name: impersonation_password_backup; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.impersonation_password_backup ENABLE ROW LEVEL SECURITY;

--
-- Name: import_orders_visits_contracts; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.import_orders_visits_contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: leader_monthly_scores; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_monthly_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: leader_score_badges; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_score_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: leader_scores_history; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.leader_scores_history ENABLE ROW LEVEL SECURITY;

--
-- Name: logs_api; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.logs_api ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenances_plans; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenances_plans_sections; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenances_plans_sections_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.maintenances_plans_sections_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

--
-- Name: materials_purchases; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.materials_purchases ENABLE ROW LEVEL SECURITY;

--
-- Name: n8n_chat_histories; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_followers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_statuses_logs; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_statuses_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_assets; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_assets_activities; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_assets_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_assets_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_chat; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_chat_participants; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_chat_reads; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_chat_reads ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_evaluations; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_extras; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_extras_followers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_extras_teams; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_extras_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_services; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_services ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_teams; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: orders_visits_vehicles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.orders_visits_vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: technicals_manuals; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals ENABLE ROW LEVEL SECURITY;

--
-- Name: technicals_manuals_assets; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: technicals_manuals_files; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.technicals_manuals_files ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: tools; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

--
-- Name: units; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users_notifications; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: users_tools; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tools ENABLE ROW LEVEL SECURITY;

--
-- Name: users_tools_movements; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tools_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: users_tracker; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.users_tracker ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: warehouses; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

--
-- Name: warehouses_materials; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE public.warehouses_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Grant All Authenticated 1t5kqn_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_namespaces; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_namespaces ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_tables; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

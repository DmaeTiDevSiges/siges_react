CREATE TABLE public.cfg_activities (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    description text,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    code character varying
);

CREATE TABLE public.assets (
    id bigint NOT NULL,
    company_id bigint,
    unit_id bigint,
    code character varying,
    description text,
    status_id bigint,
    tag_id bigint,
    tag_sub_id bigint,
    status_at timestamp without time zone,
    type_id bigint,
    searchable text,
    comments text,
    brand character varying,
    model character varying,
    serial character varying,
    power numeric,
    power_unit character varying,
    voltage character varying,
    amperage character varying,
    poles smallint,
    voltage_unit character varying,
    amperage_unit character varying,
    poles_unit character varying,
    rotation integer,
    rotation_unit character varying,
    service_factor numeric DEFAULT '1'::numeric,
    pressure_max numeric,
    pressure_min numeric,
    pressure_operation numeric,
    pressure_unit character varying,
    flow_rate_max numeric,
    flow_rate_min numeric,
    flow_rate_operation numeric,
    flow_rate_unit character varying,
    rotor_diameter numeric,
    rotor_diameter_unit character varying,
    priority_id smallint DEFAULT '3'::smallint,
    material_id bigint,
    material_code character varying,
    acquisition_at timestamp without time zone,
    location character varying,
    weight numeric,
    weight_unit character varying,
    created_user_id bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    coupling_model_id smallint,
    acquisition_value numeric DEFAULT '0'::numeric,
    version_mode character varying DEFAULT 'live'::character varying,
    img_file_path character varying,
    img_file_name character varying,
    unit_asset_tag_id bigint,
    company_owner_id bigint DEFAULT '1'::bigint,
    img_file_name_thumb character varying,
    client_id bigint
);

CREATE TABLE public.cfg_assets_couplings_models (
    id smallint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.cfg_assets_priorities (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying,
    is_available boolean
);

CREATE TABLE public.cfg_assets_statuses (
    id bigint NOT NULL,
    code character varying,
    description text,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    color text
);

CREATE TABLE public.cfg_assets_tags (
    id bigint NOT NULL,
    company_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_assets_tags_subs (
    id bigint NOT NULL,
    company_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_assets_types (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    company_id bigint,
    is_deleted boolean DEFAULT true,
    naming_pattern text
);

CREATE TABLE public.cfg_companies (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    img_file_path character varying,
    img_file_name character varying,
    is_available boolean DEFAULT true,
    email_sufix character varying,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying,
    parent_id bigint
);

CREATE TABLE public.clients (
    id bigint NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    email character varying,
    mobile character varying,
    address character varying,
    img_file_path character varying,
    img_file_name character varying,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    company_id bigint
);

CREATE TABLE public.materials (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description text,
    searchable text,
    company_id bigint,
    price_unit numeric,
    unit character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    provider_company_id bigint DEFAULT '1'::bigint,
    balance numeric DEFAULT '0'::numeric,
    finger_print character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    status_id bigint DEFAULT '1'::bigint,
    type_id bigint DEFAULT '1'::bigint
);

CREATE TABLE public.units (
    id bigint NOT NULL,
    code character varying,
    company_id bigint,
    system_parent_id bigint,
    system_id bigint,
    unit_type_parent_id bigint,
    unit_type_id bigint,
    status_id bigint,
    description character varying,
    description_full character varying,
    street_name character varying,
    street_number bigint,
    street_complement character varying,
    address_full character varying,
    latitude double precision,
    longitude double precision,
    version_mode character varying DEFAULT 'live'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_user_id bigint,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    is_available boolean DEFAULT true,
    provider_company_id bigint,
    code_sufix character varying,
    is_deleted boolean DEFAULT false,
    coordinates character varying,
    installation_code_power_supply character varying,
    img_file_path text,
    img_file_name text,
    client_id bigint,
    id_external uuid DEFAULT gen_random_uuid()
);

CREATE TABLE public.cfg_services (
    id bigint NOT NULL,
    description text,
    unit character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    code character varying,
    finger_print character varying,
    company_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone
);

CREATE TABLE public.contracts_services (
    id bigint NOT NULL,
    contract_id bigint,
    service_id bigint,
    value_unit numeric DEFAULT '1'::numeric,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    discount numeric DEFAULT '1'::numeric,
    amount numeric DEFAULT '1'::numeric,
    value_total numeric DEFAULT '1'::numeric,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.cfg_orders_causes_reasons (
    id smallint NOT NULL,
    description character varying,
    is_availabe boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_orders_priorities (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    color character varying
);

CREATE TABLE public.cfg_orders_types (
    id bigint NOT NULL,
    department_id bigint NOT NULL,
    code character varying,
    description character varying,
    is_deleted boolean DEFAULT false,
    is_available boolean DEFAULT true
);

CREATE TABLE public.cfg_orders_types_subs (
    id bigint NOT NULL,
    department_id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_orders_visits_extras_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying
);

CREATE TABLE public.cfg_systems (
    id bigint NOT NULL,
    company_id bigint,
    parent_id bigint,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_date timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_date timestamp without time zone,
    deleted_user_id bigint,
    deleted_date timestamp without time zone
);

CREATE TABLE public.cfg_teams (
    id bigint NOT NULL,
    parent_id bigint,
    code character varying NOT NULL,
    description character varying NOT NULL,
    department_id bigint NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    img_url character varying,
    users_total bigint NOT NULL,
    company_id bigint NOT NULL,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying,
    sort_order integer DEFAULT 0,
    is_evaluable boolean DEFAULT true
);

CREATE TABLE public.cfg_units_types (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    company_id bigint,
    parent_id bigint,
    is_available boolean DEFAULT true,
    deleted_user_id bigint,
    deleted_at timestamp with time zone,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.orders_visits_extras (
    id bigint NOT NULL,
    o_mask character varying,
    o_id bigint,
    approved_user_id bigint,
    approved_at timestamp without time zone,
    disapproved_user_id bigint,
    disapproved_at timestamp without time zone,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    processing_id bigint DEFAULT '1'::bigint,
    reported_at timestamp without time zone,
    reported_user_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    duration_hours double precision DEFAULT '0'::double precision,
    disapproved_comments text,
    comments text,
    is_archived boolean DEFAULT false,
    team_names_short character varying,
    unit_id bigint,
    o_type_id bigint,
    company_id bigint,
    department_id bigint,
    revised_user_id bigint,
    revised_at timestamp without time zone,
    requested_services text,
    asset_tag_id bigint,
    provider_company_id bigint,
    provider_department_id bigint,
    priority_id bigint,
    team_leader_id bigint,
    team_amount bigint DEFAULT '1'::bigint,
    team_id bigint,
    archived_user_id bigint,
    archived_at timestamp without time zone,
    deleted_at timestamp without time zone,
    system_parent_id bigint,
    system_id bigint,
    unit_type_parent_id bigint,
    unit_type_id bigint,
    o_type_sub_id bigint,
    o_cause_reason_id smallint,
    started_at_date date,
    started_at_hour_min time without time zone,
    ended_at_date date,
    ended_at_hour_min time without time zone,
    is_blocked boolean DEFAULT false,
    unblocked_user_id bigint,
    unblocked_at timestamp without time zone,
    unarchived_user_id bigint,
    unarchived_at timestamp without time zone
);

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying NOT NULL,
    name_full character varying,
    name_short character varying,
    mobile character varying,
    phone character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    team_id bigint,
    is_team_leader boolean DEFAULT false,
    img_file_path character varying DEFAULT 'settings/images'::character varying,
    company_id bigint,
    department_id bigint,
    token_fcm character varying,
    uuid uuid DEFAULT auth.uid() NOT NULL,
    status_id smallint,
    is_admin boolean DEFAULT false,
    is_admin_super boolean DEFAULT false,
    code character varying,
    version_app character varying,
    img_file_name character varying DEFAULT 'noImageUser.png'::character varying,
    team_id_previous bigint,
    ov_in_progress_leader_id bigint,
    profile_id bigint,
    vehicle_id bigint,
    is_available boolean DEFAULT true,
    is_ov_in_progress boolean DEFAULT false,
    team_amount smallint DEFAULT '1'::smallint,
    version_offline_user character varying,
    version_offline_app character varying,
    o_contract_id_in_progress bigint,
    o_type_id_in_progress bigint,
    o_type_sub_id_in_progress bigint,
    o_plan_id_in_progress bigint,
    o_asset_tag_id_in_progress bigint,
    o_unit_id_in_progress bigint,
    o_system_id_in_progress bigint,
    o_system_parent_id_in_progress bigint,
    o_unit_type_id_in_progress bigint,
    o_unit_type_parent_id_in_progress bigint,
    o_object_id_in_progress bigint,
    ov_id_in_progress bigint,
    o_id_in_progress bigint,
    op_id_in_progress bigint,
    notifications_amount integer DEFAULT 0,
    mobile_full text,
    mobile_mask text,
    mobile_whatsapp text,
    migrated_at timestamp without time zone,
    latitude double precision,
    longitude double precision,
    ov_id_in_progress_mask character varying,
    tracker_interval_seconds bigint DEFAULT '300'::bigint,
    shift_start time without time zone DEFAULT '08:00:00'::time without time zone,
    shift_end time without time zone DEFAULT '18:00:00'::time without time zone,
    last_online timestamp with time zone,
    tracker_heartbeat_at timestamp without time zone,
    tracker_accuracy double precision,
    tracked_at timestamp without time zone,
    signature_image_path text,
    signature_image_name character varying,
    is_logged_out_with_visit boolean DEFAULT false
);

CREATE TABLE public.cfg_orders_cancel_reasons (
    id bigint NOT NULL,
    department_id bigint,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_orders_objects (
    id smallint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true
);

CREATE TABLE public.cfg_orders_plans (
    id bigint NOT NULL,
    department_id bigint,
    code character varying,
    description text,
    is_available boolean DEFAULT true,
    version character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.cfg_orders_statuses (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    code text,
    description text,
    is_available boolean DEFAULT true,
    icon text,
    icon_color text,
    background_color text,
    priority_level integer
);

CREATE TABLE public.cfg_orders_suspended_reasons (
    id bigint NOT NULL,
    department_id bigint,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.contracts (
    id bigint NOT NULL,
    client_company_id bigint,
    client_department_id bigint,
    provider_company_id bigint,
    provider_department_id bigint,
    description text,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    code character varying,
    status_id smallint DEFAULT '1'::smallint,
    created_user_id bigint,
    created_date timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_date timestamp without time zone,
    deleted_user_id bigint,
    deleted_date timestamp without time zone,
    is_dev boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying,
    default_ov_asset_id bigint,
    default_activity_id bigint,
    date_start timestamp without time zone,
    date_end timestamp without time zone,
    total_value double precision,
    client_id bigint,
    object text,
    is_use_manus boolean DEFAULT false
);

CREATE TABLE public.orders (
    id bigint NOT NULL,
    plan_id bigint,
    object_id smallint,
    company_id bigint DEFAULT '1'::bigint,
    department_id bigint,
    parent_id bigint,
    type_id bigint,
    type_sub_id bigint,
    team_leader_id bigint,
    status_id bigint DEFAULT '1'::bigint,
    status_at timestamp without time zone,
    unit_id bigint,
    system_parent_id bigint,
    system_id bigint,
    unit_type_parent_id bigint,
    unit_type_id bigint,
    requester_name character varying,
    requester_team_id bigint,
    requester_phone character varying,
    requested_at timestamp without time zone,
    requested_services text,
    counter_parent bigint,
    counter_child integer DEFAULT 0,
    year integer,
    order_mask character varying,
    priority_id bigint,
    team_id bigint,
    unit_latitude double precision,
    unit_longitude double precision,
    contract_id bigint,
    provider_company_id bigint,
    asset_tag_id bigint,
    materials_value numeric DEFAULT '0'::numeric,
    services_value numeric DEFAULT '0'::numeric,
    vehicles_value numeric DEFAULT '0'::numeric,
    total_value numeric DEFAULT '0'::numeric,
    cause_reason_id smallint,
    suspended_reason_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    uid character varying,
    notifications_amount bigint DEFAULT '0'::bigint,
    provider_department_id bigint,
    img_file_path character varying,
    img_file_name character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    ov_counter smallint DEFAULT '0'::smallint,
    progress numeric DEFAULT '0'::numeric,
    x_ss_id character varying,
    x_ss_mae_id character varying,
    canceled_user_id bigint,
    canceled_at timestamp without time zone,
    cancel_reason_id bigint,
    canceled_team_id bigint,
    asset_tag_sub_id bigint,
    asset_available_id bigint,
    client_id bigint DEFAULT '1'::bigint,
    img_files_names jsonb,
    unit_asset_tag_id bigint,
    unit_asset_tag_has_order boolean DEFAULT true,
    unit_asset_tag_no_has_order_user_id bigint,
    unit_asset_tag_no_has_order_at timestamp without time zone,
    rating smallint DEFAULT '0'::smallint
);

CREATE TABLE public.cfg_orders_types_activities (
    id bigint NOT NULL,
    o_type_id bigint,
    activity_id bigint,
    is_available boolean DEFAULT true,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.technicals_manuals (
    id bigint NOT NULL,
    description text,
    doc_file_path text,
    doc_file_name text,
    company_id bigint,
    assets_amount bigint DEFAULT '0'::bigint NOT NULL,
    asset_type_id bigint,
    code text
);

CREATE TABLE public.cfg_units_assets_tags (
    id bigint NOT NULL,
    unit_id bigint,
    asset_tag_id bigint,
    asset_tag_sub_id bigint,
    last_created_at timestamp without time zone NOT NULL,
    last_is_available boolean,
    last_status_id bigint,
    last_processing_id bigint DEFAULT '1'::bigint,
    last_created_user_id bigint,
    last_asset_available_id bigint DEFAULT '0'::bigint,
    last_file_path character varying,
    last_file_name character varying,
    last_comments character varying,
    last_asset_unavailable_reason_id bigint,
    last_reported_at timestamp without time zone,
    last_reported_user_id bigint,
    flow_rate_unit character varying,
    asset_available_rate numeric,
    last_asset_available_rate numeric,
    deleted_at timestamp without time zone,
    deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone,
    created_user_id bigint,
    flow_rate_min numeric,
    flow_rate_max numeric,
    last_is_on boolean,
    power_unit character varying,
    power_min numeric,
    power_max numeric,
    operation_unit character varying,
    last_operation_record numeric,
    pressure_unit character varying,
    pressure_min numeric,
    pressure_max numeric,
    last_flow_rate numeric,
    last_power numeric,
    last_pressure numeric,
    flow_rate_is_visible boolean,
    power_is_visible boolean,
    pressure_is_visible boolean,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    asset_tag_tag_sub_description character varying,
    is_active boolean DEFAULT true,
    voltage_unit character varying,
    voltage_min numeric,
    voltage_max numeric,
    voltage_is_visible boolean DEFAULT true,
    last_voltage numeric,
    amperage_unit character varying,
    amperage_min numeric,
    amperage_max numeric,
    amperage_is_visible boolean DEFAULT true,
    last_amperage numeric,
    last_o_id bigint DEFAULT '0'::bigint,
    op_counter bigint DEFAULT '0'::bigint,
    last_provider_company_id bigint
);

CREATE TABLE public.cfg_assets_available_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying
);

CREATE TABLE public.cfg_assets_unavailable_reasons (
    id smallint NOT NULL,
    code character varying,
    description character varying,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_units_statuses (
    id smallint NOT NULL,
    code text,
    description text,
    color text
);

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint
);

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);

CREATE TABLE public.ai_chat_histories (
    id bigint NOT NULL,
    session_id text NOT NULL,
    user_id uuid,
    agent text,
    role text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ai_chat_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    title text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ai_knowledge (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding extensions.vector(768),
    created_at timestamp with time zone DEFAULT now(),
    source_type text
);

CREATE TABLE public.ai_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    session_id uuid,
    role text,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);

CREATE TABLE public.api_keys (
    id bigint NOT NULL,
    company_name text,
    api_key text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.assets_alerts (
    id bigint NOT NULL,
    asset_id bigint,
    o_type_id bigint,
    priority_id bigint,
    description text,
    is_done boolean DEFAULT false,
    ova_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    o_id bigint
);

CREATE TABLE public.assets_attributes_values (
    asset_id bigint NOT NULL,
    field_key text NOT NULL,
    value text
);

CREATE TABLE public.assets_available (
    id bigint NOT NULL,
    created_at timestamp without time zone NOT NULL,
    unit_id bigint,
    asset_id bigint,
    asset_tag_id bigint,
    asset_tag_sub_id bigint,
    is_available boolean,
    status_id bigint,
    file_path text,
    file_name text,
    comments character varying,
    created_user_id bigint,
    asset_unavailable_reason_id bigint DEFAULT '0'::bigint,
    processing_id smallint DEFAULT '1'::smallint,
    reported_at timestamp without time zone,
    reported_user_id bigint,
    operation_record numeric,
    reported_latitude double precision,
    reported_longitude double precision,
    reported_coordinates character varying,
    is_on boolean,
    operation_unit character varying,
    flow_rate_unit character varying,
    flow_rate_min numeric DEFAULT '0'::numeric,
    flow_rate_max numeric DEFAULT '0'::numeric,
    power_unit character varying,
    power_min numeric DEFAULT '0'::numeric,
    power_max numeric DEFAULT '0'::numeric,
    pressure_unit character varying,
    pressure_min numeric DEFAULT '0'::numeric,
    pressure_max numeric DEFAULT '0'::numeric,
    flow_rate_is_on numeric DEFAULT '0'::numeric,
    power_is_on numeric DEFAULT '0'::numeric,
    pressure_is_on numeric DEFAULT '0'::numeric,
    flow_rate_is_available numeric DEFAULT '0'::numeric,
    power_is_available numeric DEFAULT '0'::numeric,
    pressure_is_available numeric DEFAULT '0'::numeric,
    voltage_unit character varying,
    voltage_min numeric DEFAULT '0'::numeric,
    voltage_max numeric DEFAULT '0'::numeric,
    voltage_is_on boolean DEFAULT true,
    voltage_is_available boolean DEFAULT true,
    unit_latitude double precision,
    unit_longitude double precision,
    unit_reported_distance_m double precision,
    is_web boolean DEFAULT false,
    company_id bigint DEFAULT '1'::bigint,
    provider_company_id bigint,
    o_id bigint,
    o_mask character varying,
    is_deleted boolean DEFAULT false,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    unit_asset_tag_id bigint
);

CREATE TABLE public.assets_followers (
    id bigint NOT NULL,
    user_id bigint,
    asset_id bigint,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.assets_loans (
    id bigint NOT NULL,
    asset_id bigint NOT NULL,
    borrower_name character varying(255) NOT NULL,
    lender_user_id bigint NOT NULL,
    expected_return_date date NOT NULL,
    actual_return_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    notes text,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_user_id bigint,
    deleted_user_id bigint,
    signature_delivery_path text,
    signature_delivery_name character varying(255) DEFAULT NULL::character varying,
    signature_delivery_at timestamp without time zone,
    signature_return_path text,
    signature_return_name character varying(255) DEFAULT NULL::character varying,
    signature_return_at timestamp without time zone,
    signature_delivery_signer_name character varying(255) DEFAULT NULL::character varying,
    signature_return_signer_name character varying(255) DEFAULT NULL::character varying,
    inspector_delivery_user_id bigint,
    inspector_return_user_id bigint,
    items_checklists_divergent_count integer DEFAULT 0,
    CONSTRAINT assets_loans_status_check CHECK (((status)::text = ANY ((ARRAY['analysis'::character varying, 'pending'::character varying, 'closed'::character varying, 'overdue'::character varying])::text[])))
);

CREATE TABLE public.assets_loans_checklists (
    id bigint NOT NULL,
    loan_id bigint NOT NULL,
    loan_checklist_id bigint,
    phase character varying(15) NOT NULL,
    status character varying(15) DEFAULT 'pending'::character varying,
    custom_item_description character varying(255),
    notes text,
    filled_by_user_id bigint,
    filled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    is_divergent boolean DEFAULT false,
    CONSTRAINT assets_loans_checklists_phase_check CHECK (((phase)::text = ANY ((ARRAY['before'::character varying, 'after'::character varying])::text[]))),
    CONSTRAINT assets_loans_checklists_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'ok'::character varying, 'damaged'::character varying, 'missing'::character varying, 'not_applicable'::character varying])::text[])))
);

CREATE TABLE public.assets_loans_checklists_images (
    id bigint NOT NULL,
    checklist_id bigint NOT NULL,
    image_url text NOT NULL,
    image_type character varying(20) DEFAULT 'photo'::character varying,
    uploaded_by_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT assets_loans_checklists_images_image_type_check CHECK (((image_type)::text = ANY ((ARRAY['photo'::character varying, 'document'::character varying, 'damage'::character varying])::text[])))
);

CREATE TABLE public.assets_materials (
    id bigint NOT NULL,
    asset_id bigint,
    material_id bigint,
    is_original boolean DEFAULT true,
    brand_model text,
    model text,
    serial text,
    date_in timestamp without time zone,
    date_out timestamp without time zone,
    recorder_in bigint,
    recorder_out bigint,
    order_visit_asset_id bigint,
    amount numeric,
    location text,
    order_parent_id bigint,
    order_id bigint,
    order_visit_id bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.audits_logs (
    id bigint NOT NULL,
    created_date timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    user_uuid uuid,
    table_name text,
    operation text,
    data_old jsonb,
    data_new jsonb,
    user_id bigint
);

CREATE TABLE public.carts_materials (
    id bigint NOT NULL,
    user_id bigint,
    material_id bigint,
    amount numeric,
    created_at timestamp without time zone NOT NULL,
    cart_id bigint,
    version_mode character varying DEFAULT 'live'::character varying,
    ova_id bigint,
    created_user_id bigint,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_app (
    id bigint NOT NULL,
    apk_url character varying NOT NULL,
    version_app character varying NOT NULL,
    logo_url character varying,
    version_app_offline character varying DEFAULT '1'::character varying,
    n8n_available_last_at timestamp without time zone,
    version_app_mask text
);

CREATE TABLE public.cfg_app_notices (
    id bigint NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    category_id integer NOT NULL,
    severity_id integer NOT NULL,
    start_date timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text) NOT NULL,
    end_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text),
    updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text),
    is_active boolean DEFAULT true,
    dashboards text[] DEFAULT ARRAY['dashboard'::text, 'orders'::text, 'units'::text],
    created_user_id integer NOT NULL,
    CONSTRAINT check_end_date_after_start CHECK ((end_date > start_date))
);

CREATE TABLE public.cfg_app_notices_categories (
    id integer NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#6B7280'::text NOT NULL,
    icon text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text)
);

CREATE TABLE public.cfg_app_notices_severities (
    id integer NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#6B7280'::text NOT NULL,
    icon text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'::text)
);

CREATE TABLE public.cfg_app_offline_updates (
    id bigint NOT NULL,
    table_name text,
    version_offline character varying DEFAULT '1'::character varying,
    updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text)
);

CREATE TABLE public.cfg_app_pages (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    is_available_provider boolean DEFAULT false
);

CREATE TABLE public.cfg_app_tips (
    title text NOT NULL,
    body text NOT NULL,
    icon text DEFAULT 'lightbulb'::text NOT NULL,
    screen_target text DEFAULT '*'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    id integer NOT NULL,
    target_mode text DEFAULT 'all'::text NOT NULL
);

CREATE TABLE public.cfg_app_tips_companies (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    company_id bigint NOT NULL
);

CREATE TABLE public.cfg_app_tips_departments (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    department_id bigint NOT NULL
);

CREATE TABLE public.cfg_app_tips_dismissals (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    user_id integer NOT NULL,
    dismissed_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.cfg_app_tips_profiles (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    profile_id bigint NOT NULL
);

CREATE TABLE public.cfg_app_versions_update (
    id bigint NOT NULL,
    app_version character varying,
    updates text
);

CREATE TABLE public.cfg_assets_attributes (
    id bigint NOT NULL,
    field_key character varying NOT NULL,
    label character varying NOT NULL,
    data_type character varying DEFAULT 'text'::character varying NOT NULL,
    unit character varying,
    decimals integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    select_options jsonb,
    select_options_group_id bigint
);

CREATE TABLE public.cfg_assets_attributes_groups (
    id bigint NOT NULL,
    group_name character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    parent_id bigint
);

CREATE TABLE public.cfg_assets_types_attributes (
    id bigint NOT NULL,
    asset_type_id bigint NOT NULL,
    attribute_id bigint NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    col_span smallint DEFAULT 12
);

CREATE TABLE public.cfg_assets_types_loans_checklists (
    id bigint NOT NULL,
    checklist_id bigint NOT NULL,
    asset_type_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.cfg_contracts_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);

CREATE TABLE public.cfg_departments (
    id bigint NOT NULL,
    code character varying NOT NULL,
    description character varying NOT NULL,
    parent_id bigint,
    company_id bigint,
    is_available boolean DEFAULT true,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.cfg_evaluation_requirements (
    id bigint NOT NULL,
    description character varying(255) NOT NULL,
    code character varying(50),
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.cfg_loans_checklists (
    id bigint NOT NULL,
    description character varying(255) NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.cfg_materials_purchases_statuses (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL
);

CREATE TABLE public.cfg_materials_purchases_cancel_reasons (
    id bigint NOT NULL,
    description character varying(100) NOT NULL,
    is_available boolean DEFAULT true
);

CREATE TABLE public.cfg_materials_purchases_types (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(100) NOT NULL,
    is_available boolean DEFAULT true
);

CREATE TABLE public.cfg_materials_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);

CREATE TABLE public.cfg_materials_types (
    id bigint NOT NULL,
    code character varying,
    description character varying
);

CREATE TABLE public.cfg_orders_counter (
    id bigint NOT NULL,
    company_id bigint,
    year integer,
    counter bigint DEFAULT '0'::bigint,
    is_dev boolean DEFAULT false,
    version character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.cfg_orders_visits_processing (
    id bigint NOT NULL,
    code character varying,
    description character varying,
    icon text DEFAULT 'engineering'::text,
    icon_color text DEFAULT 'text-white'::text,
    bg_color text DEFAULT 'bg-slate-500'::text
);

CREATE TABLE public.cfg_orders_visits_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);

CREATE TABLE public.cfg_profiles (
    id bigint NOT NULL,
    description character varying,
    department_id bigint,
    version character varying DEFAULT 'live'::character varying,
    company_id bigint DEFAULT '1'::bigint
);

CREATE TABLE public.cfg_profiles_access (
    id bigint NOT NULL,
    profile_id bigint NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    route_id bigint NOT NULL,
    can_search boolean DEFAULT false NOT NULL
);

CREATE TABLE public.cfg_profiles_permissions (
    id bigint NOT NULL,
    profile_id bigint,
    app_page_id bigint
);

CREATE TABLE public.cfg_routes (
    id bigint NOT NULL,
    route_key character varying NOT NULL,
    route_path character varying NOT NULL,
    description character varying NOT NULL,
    icon character varying,
    parent_id bigint,
    order_index integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_visible_to_admin boolean DEFAULT true
);

CREATE TABLE public.cfg_technicals_manuals_categories (
    id bigint NOT NULL,
    description text,
    version_mode character varying DEFAULT 'live'::character varying,
    created_user_id double precision,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);

CREATE TABLE public.cfg_users_statuses (
    id bigint NOT NULL,
    code character varying,
    description character varying
);

CREATE TABLE public.chat_agent_ai (
    id bigint NOT NULL,
    user_id bigint,
    "from" character varying,
    msg text,
    created_at timestamp without time zone NOT NULL
);

CREATE TABLE public.contracts_evaluation_requirements (
    id bigint NOT NULL,
    contract_id bigint NOT NULL,
    evaluation_id bigint NOT NULL,
    weight integer NOT NULL,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.contracts_managers (
    id bigint NOT NULL,
    contract_id bigint,
    manager_id bigint,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    role character varying DEFAULT 'viewer'::character varying
);

CREATE TABLE public.documents (
    id bigint NOT NULL,
    content text,
    metadata jsonb,
    embedding extensions.vector(1536)
);

CREATE TABLE public.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);

CREATE TABLE public.goose_db_version (
    id integer NOT NULL,
    version_id bigint NOT NULL,
    is_applied boolean NOT NULL,
    tstamp timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.impersonation_password_backup (
    id bigint NOT NULL,
    user_uuid uuid NOT NULL,
    user_email text NOT NULL,
    original_encrypted_password text NOT NULL,
    backed_up_at timestamp with time zone DEFAULT now(),
    restored_at timestamp with time zone
);

CREATE TABLE public.import_orders_visits_contracts (
    id bigint NOT NULL,
    user_email character varying,
    contract_code character varying,
    year integer,
    month smallint,
    date timestamp without time zone,
    unit_code character varying,
    asset_code character varying,
    activity_code character varying,
    activity_description character varying,
    service_code character varying,
    service_description character varying,
    service_unit character varying,
    value_unit double precision,
    amount double precision,
    discount double precision,
    value_total double precision,
    success boolean DEFAULT true,
    error_msg character varying,
    order_mask character varying,
    processing_id smallint DEFAULT '1'::smallint,
    created_at timestamp without time zone DEFAULT now(),
    finger_print character varying
);

CREATE TABLE public.leader_monthly_scores (
    id bigint NOT NULL,
    leader_id bigint NOT NULL,
    leader_name character varying,
    department_id bigint NOT NULL,
    department_name character varying,
    score_year integer NOT NULL,
    score_month integer NOT NULL,
    total_visits integer DEFAULT 0 NOT NULL,
    total_evaluations integer DEFAULT 0 NOT NULL,
    failed_evaluations integer DEFAULT 0 NOT NULL,
    total_penalty_score numeric(10,2) DEFAULT 0 NOT NULL,
    avg_compliance_score numeric(5,2) DEFAULT 0 NOT NULL,
    best_compliance_score numeric(5,2) DEFAULT 0 NOT NULL,
    worst_compliance_score numeric(5,2) DEFAULT 0 NOT NULL,
    ranking_position integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.leader_score_badges (
    id bigint NOT NULL,
    leader_id bigint NOT NULL,
    badge_code character varying(50) NOT NULL,
    badge_name character varying(100) NOT NULL,
    badge_description text,
    score_year integer NOT NULL,
    score_month integer NOT NULL,
    earned_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.leader_scores_history (
    id bigint NOT NULL,
    leader_id bigint NOT NULL,
    ov_id bigint NOT NULL,
    order_id bigint,
    score_year integer NOT NULL,
    score_month integer NOT NULL,
    total_evaluations integer DEFAULT 0 NOT NULL,
    failed_evaluations integer DEFAULT 0 NOT NULL,
    penalty_score numeric(10,2) DEFAULT 0 NOT NULL,
    max_possible_score numeric(10,2) DEFAULT 0 NOT NULL,
    compliance_score numeric(5,2) DEFAULT 100 NOT NULL,
    evaluated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.logs_api (
    id bigint NOT NULL,
    api_key text,
    endpoint text,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.maintenances_plans (
    id bigint NOT NULL,
    code character varying,
    description text NOT NULL,
    asset_type_id bigint,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone
);

CREATE TABLE public.maintenances_plans_sections (
    id bigint NOT NULL,
    maintenance_plan_id bigint,
    description text NOT NULL,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    order_index bigint DEFAULT '0'::bigint
);

CREATE TABLE public.maintenances_plans_sections_activities (
    id bigint NOT NULL,
    maintenance_plan_section_id bigint,
    activity_id bigint,
    is_available boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_user_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    order_index bigint DEFAULT '0'::bigint,
    description text,
    comments_default text
);

CREATE TABLE public.materials_purchases (
    id bigint NOT NULL,
    material_id bigint NOT NULL,
    purchase_type_id bigint NOT NULL,
    quantity numeric NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    justification text NOT NULL,
    status_id bigint NOT NULL,
    requester_user_id bigint NOT NULL,
    authorizer_user_id bigint,
    authorized_at timestamp without time zone,
    cancel_reason text,
    concluded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    warehouse_id bigint,
    created_user_id bigint,
    code character varying(50),
    cancel_reason_id bigint
);

CREATE TABLE public.n8n_chat_histories (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    message jsonb NOT NULL
);

CREATE TABLE public.orders_followers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    o_id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.orders_statuses_logs (
    id bigint NOT NULL,
    order_id bigint,
    order_status_id bigint,
    order_status_ate timestamp without time zone,
    created_user_id bigint,
    created_date timestamp without time zone,
    order_parent_id bigint,
    company_id bigint,
    department_id bigint
);

CREATE TABLE public.orders_visits (
    id bigint NOT NULL,
    ov_mask character varying,
    visit_counter integer,
    o_id bigint,
    ov_approved_user_id bigint,
    ov_approved_at timestamp without time zone,
    ov_disapproved_user_id bigint,
    ov_disapproved_at timestamp without time zone,
    ov_started_at timestamp without time zone,
    ov_ended_at timestamp without time zone,
    ov_processing_id bigint DEFAULT '1'::bigint,
    ov_status_id bigint DEFAULT '1'::bigint,
    ov_reported_at timestamp without time zone,
    ov_reported_user_id bigint,
    ov_team_leader_id bigint,
    ov_assets_amount integer DEFAULT 0,
    ov_assets_approved_filed_amount integer DEFAULT 0,
    ov_assets_disapproved_amount integer DEFAULT 0,
    ov_assets_reported_amount integer DEFAULT 0,
    ov_materials_value numeric DEFAULT '0'::numeric,
    ov_services_value numeric DEFAULT '0'::numeric,
    ov_vehicles_value numeric DEFAULT '0'::numeric,
    ov_created_user_id bigint,
    ov_created_at timestamp without time zone,
    ov_updated_user_id bigint,
    ov_updated_at timestamp without time zone,
    ov_deleted_user_id bigint,
    is_deleted boolean DEFAULT false,
    ov_duration_hours double precision DEFAULT '0'::double precision,
    ov_disapproved_comments text,
    ov_assets_draft_amount integer DEFAULT 0,
    is_canceled boolean DEFAULT false,
    ov_comments text,
    o_cancel_reason_id bigint,
    ov_created_latitude double precision,
    ov_created_longitude double precision,
    ov_total_value numeric DEFAULT '0'::numeric,
    ov_is_filed boolean DEFAULT false,
    ov_team_amount integer DEFAULT 1,
    ov_assets_revised_amount integer DEFAULT 0,
    ov_revised_user_id bigint,
    ov_revised_at timestamp without time zone,
    ov_team_names_short character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    ov_rpt_file_path character varying,
    ov_rpt_file_name character varying,
    ov_o_suspended_reason_id bigint,
    ov_o_status_id bigint DEFAULT '5'::bigint,
    ov_o_progress numeric DEFAULT '0'::numeric,
    ov_img_file_path text,
    ov_img_file_name text,
    ov_pdf_file_path text,
    ov_pdf_file_name text,
    is_extra boolean DEFAULT false,
    ov_assets_approved_no_filed_amount integer DEFAULT 0,
    ov_approved_filed_user_id bigint,
    ov_approved_filed_at timestamp without time zone,
    finger_print character varying,
    ov_payment_at timestamp without time zone,
    ov_payment_invoices text,
    ov_started_year smallint,
    ov_started_month smallint,
    ov_invoices character varying,
    ov_assets_approved_amount bigint,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    ov_signature_leader_path text,
    ov_signature_leader_name character varying,
    ov_signature_leader_at timestamp without time zone,
    ov_signature_requester_path text,
    ov_signature_requester_name character varying,
    ov_signature_requester_at timestamp without time zone,
    chat_status text DEFAULT 'open'::text NOT NULL,
    chat_closed_at timestamp with time zone,
    chat_closed_user_id bigint,
    chat_created_user_id bigint,
    ov_costs_status text,
    ov_costs_waiting_at timestamp without time zone,
    ov_costs_waiting_user_id bigint,
    ov_costs_approved_at timestamp without time zone,
    ov_costs_approved_user_id bigint,
    ov_costs_rejected_at timestamp without time zone,
    ov_costs_rejected_user_id bigint,
    ov_costs_rejection_reason text,
    CONSTRAINT orders_visits_ov_costs_status_check CHECK (((ov_costs_status IS NULL) OR (ov_costs_status = ANY (ARRAY['pending'::text, 'waiting'::text, 'approved'::text, 'rejected'::text]))))
);

CREATE TABLE public.orders_visits_assets (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    asset_id bigint NOT NULL,
    before_unit_id bigint,
    before_tag_id bigint,
    before_tag_sub_id bigint,
    before_status_id bigint,
    before_status_at timestamp without time zone,
    before_comments text,
    before_img_file_path character varying,
    before_img_file_name character varying,
    before_latitude double precision,
    before_longitude double precision,
    before_unit_latitude double precision,
    before_unit_longitude double precision,
    before_priority_id smallint,
    after_unit_id bigint,
    after_tag_id bigint,
    after_tag_sub_id bigint,
    after_status_id bigint,
    after_status_at timestamp without time zone,
    after_comments character varying,
    after_img_file_path character varying,
    after_img_file_name character varying,
    after_latitude double precision,
    after_longitude double precision,
    after_unit_latitude double precision,
    after_unit_longitude double precision,
    after_priority_id smallint,
    is_moved boolean DEFAULT false,
    moved_comments text,
    has_recorder boolean DEFAULT true,
    before_recorder bigint,
    after_recorder bigint,
    processing_id bigint,
    o_id bigint,
    op_id bigint,
    activities_searchable text,
    reported_user_id bigint,
    reported_at timestamp without time zone,
    disapproved_user_id bigint,
    disapproved_at timestamp without time zone,
    disapproved_notes character varying,
    approved_user_id bigint,
    approved_at timestamp without time zone,
    revised_user_id bigint,
    revised_at timestamp without time zone,
    created_user_id bigint,
    created_at timestamp without time zone,
    created_latitude double precision,
    created_longitude double precision,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    cart_materials_amount bigint DEFAULT '0'::bigint,
    materials_value numeric DEFAULT '0'::numeric,
    services_value numeric DEFAULT '0'::numeric,
    vehicles_value numeric DEFAULT '0'::numeric,
    total_value numeric DEFAULT '0'::numeric,
    before_unit_asset_tag_id bigint DEFAULT '0'::bigint,
    after_unit_asset_tag_id bigint DEFAULT '0'::bigint,
    before_img_file_name_thumb character varying,
    after_img_file_name_thumb character varying,
    is_filed boolean DEFAULT false,
    before_img_files_names jsonb,
    after_img_files_names jsonb,
    before_client_id bigint,
    after_client_id bigint,
    before_location text,
    after_location text,
    activities_description text,
    maintenance_plan_id bigint,
    maintenance_plan_progress numeric DEFAULT '0'::numeric
);

CREATE TABLE public.orders_visits_assets_activities (
    id bigint NOT NULL,
    activity_id bigint NOT NULL,
    ova_id bigint NOT NULL,
    amount numeric DEFAULT '1'::numeric,
    ov_id bigint,
    o_id bigint,
    op_id bigint,
    version_mode character varying DEFAULT 'live'::character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    maintenance_plan_id bigint,
    img_file_path character varying,
    img_files_names jsonb,
    comments text,
    status character varying(10) DEFAULT NULL::character varying
);

CREATE TABLE public.orders_visits_assets_materials (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    asset_id bigint NOT NULL,
    material_id bigint NOT NULL,
    amount numeric DEFAULT '1'::numeric,
    value_unit numeric DEFAULT '1'::numeric,
    value_total numeric DEFAULT '1'::numeric,
    discount numeric DEFAULT '1'::numeric,
    version_mode character varying DEFAULT 'live'::character varying,
    comments character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    ova_id bigint,
    ov_costs_status character varying DEFAULT 'pending'::character varying NOT NULL
);

CREATE TABLE public.orders_visits_chat (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    user_id bigint NOT NULL,
    message text NOT NULL,
    is_action_item boolean DEFAULT false,
    is_resolved boolean DEFAULT false,
    info_requested boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.orders_visits_chat_participants (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.orders_visits_chat_reads (
    id bigint NOT NULL,
    chat_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.orders_visits_evaluations (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    contract_evaluation_id bigint NOT NULL,
    was_applied boolean DEFAULT false NOT NULL,
    notes text,
    evaluated_by_user_id bigint NOT NULL,
    evaluated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.orders_visits_extras_followers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    ove_id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.orders_visits_extras_teams (
    ove_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_leader boolean DEFAULT false NOT NULL,
    id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying,
    order_by bigint DEFAULT '0'::bigint,
    duration_hours double precision DEFAULT '0'::double precision,
    started_at_date date,
    started_at_hour_min time without time zone,
    ended_at_date date,
    ended_at_hour_min time without time zone
);

CREATE TABLE public.orders_visits_services (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    service_id bigint NOT NULL,
    value_unit numeric,
    amount numeric,
    discount numeric,
    value_total numeric,
    version_mode character varying DEFAULT 'live'::character varying,
    comments character varying,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    ov_costs_status character varying DEFAULT 'pending'::character varying NOT NULL
);

CREATE TABLE public.orders_visits_teams (
    ov_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_leader boolean DEFAULT false NOT NULL,
    id bigint NOT NULL,
    version_mode character varying DEFAULT 'live'::character varying,
    order_id smallint
);

CREATE TABLE public.orders_visits_vehicles (
    id bigint NOT NULL,
    ov_id bigint NOT NULL,
    vehicle_id bigint NOT NULL,
    recorder_start bigint DEFAULT '0'::bigint,
    recorder_end bigint DEFAULT '0'::bigint,
    amount bigint DEFAULT '0'::bigint,
    value_unit numeric DEFAULT '0'::numeric,
    value_total numeric DEFAULT '0'::numeric,
    discount numeric DEFAULT '1'::numeric,
    created_user_id bigint,
    created_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    version_mode character varying DEFAULT 'live'::character varying,
    ov_costs_status character varying DEFAULT 'pending'::character varying NOT NULL
);

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);

CREATE TABLE public.technicals_manuals_assets (
    id bigint NOT NULL,
    tm_id bigint,
    asset_id bigint,
    version_mode character varying DEFAULT 'live'::character varying
);

CREATE TABLE public.technicals_manuals_files (
    id bigint DEFAULT nextval('public.technicals_manuals_files_id_seq'::regclass) NOT NULL,
    tm_id bigint NOT NULL,
    doc_file_path text,
    doc_file_name text,
    file_type character varying DEFAULT 'pdf'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    tm_category_id bigint
);

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0,
    broadcast_adapter character varying(255) DEFAULT 'gen_rpc'::character varying,
    max_presence_events_per_second integer DEFAULT 1000,
    max_payload_size_in_kb integer DEFAULT 3000
);

CREATE TABLE public.tools (
    id integer NOT NULL,
    brand character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    serial_number character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'DISPONIVEL'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_user_id integer,
    material_id bigint,
    code character varying(100) DEFAULT ''::character varying NOT NULL,
    deleted_at timestamp without time zone,
    deleted_user_id integer,
    is_deleted boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone,
    updated_user_id integer,
    CONSTRAINT tools_status_check CHECK (((status)::text = ANY ((ARRAY['DISPONIVEL'::character varying, 'EM_USO'::character varying, 'MANUTENCAO'::character varying, 'BAIXADA'::character varying])::text[])))
);

CREATE TABLE public.users_notifications (
    id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id_to bigint,
    user_id_from bigint,
    title character varying,
    body character varying,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    table_id bigint,
    img_url character varying,
    type character varying,
    o_id bigint,
    ov_id bigint,
    activity_id bigint,
    company_id bigint,
    token_fcm character varying,
    img_file_path character varying,
    img_file_name character varying,
    user_from_name_short character varying,
    page_target character varying,
    version_mode character varying DEFAULT 'live'::character varying,
    user_to_whatsapp text,
    material_id bigint
);

CREATE TABLE public.users_tools (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tool_id integer NOT NULL,
    amount integer DEFAULT 1,
    date_start timestamp without time zone DEFAULT now(),
    date_end timestamp without time zone,
    status character varying(50) DEFAULT 'USO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_user_id integer,
    CONSTRAINT users_tools_status_check CHECK (((status)::text = ANY ((ARRAY['USO'::character varying, 'BAIXADO'::character varying, 'TRANSFERIDO'::character varying])::text[])))
);

CREATE TABLE public.users_tools_movements (
    id integer NOT NULL,
    tool_id integer NOT NULL,
    from_user_id integer,
    to_user_id integer,
    movement_type character varying(50) NOT NULL,
    amount integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    created_user_id integer,
    CONSTRAINT users_tools_movements_movement_type_check CHECK (((movement_type)::text = ANY ((ARRAY['INCLUSAO'::character varying, 'TRANSFERENCIA'::character varying, 'BAIXA'::character varying])::text[])))
);

CREATE TABLE public.users_tracker (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    latitude double precision,
    longitude double precision,
    createddate timestamp with time zone,
    device character varying
);

CREATE TABLE public.warehouses (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    code text,
    description text,
    address text,
    latidude double precision,
    longitude double precision,
    is_available boolean,
    created_at timestamp without time zone,
    created_user_id bigint,
    updated_at timestamp without time zone,
    updated_user_id bigint,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    deleted_user_id bigint
);

CREATE TABLE public.warehouses_materials (
    id integer NOT NULL,
    warehouse_id integer NOT NULL,
    material_id bigint NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0 NOT NULL,
    cost_avg numeric(15,4) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    updated_user_id integer,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    deleted_user_id integer,
    CONSTRAINT warehouses_materials_quantity_check CHECK ((quantity >= 0))
);

CREATE TABLE public.vehicles (
    id bigint NOT NULL,
    company_id bigint,
    department_id bigint,
    plates text,
    value_unit numeric DEFAULT '0'::numeric,
    is_available boolean DEFAULT true NOT NULL,
    unit text DEFAULT 'Km'::text,
    discount numeric DEFAULT '1'::numeric,
    description text,
    finger_print text,
    created_user_id bigint,
    created_at timestamp without time zone,
    updated_user_id bigint,
    updated_at timestamp without time zone,
    deleted_user_id bigint,
    deleted_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE storage.iceberg_namespaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE storage.iceberg_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    namespace_id uuid NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

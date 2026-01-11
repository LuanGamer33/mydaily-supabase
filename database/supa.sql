BEGIN;

CREATE TABLE IF NOT EXISTS auth.audit_log_entries
(
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying,
    CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.audit_log_entries
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.audit_log_entries
    IS 'Auth: Registro de auditoría para acciones de usuario.';

CREATE TABLE IF NOT EXISTS auth.flow_state
(
    id uuid NOT NULL,
    user_id uuid,
    auth_code text COLLATE pg_catalog."default" NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text COLLATE pg_catalog."default" NOT NULL,
    provider_type text COLLATE pg_catalog."default" NOT NULL,
    provider_access_token text COLLATE pg_catalog."default",
    provider_refresh_token text COLLATE pg_catalog."default",
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text COLLATE pg_catalog."default" NOT NULL,
    auth_code_issued_at timestamp with time zone,
    CONSTRAINT flow_state_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.flow_state
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.flow_state
    IS 'almacena metadatos para inicios de sesión pkce';

CREATE TABLE IF NOT EXISTS auth.identities
(
    provider_id text COLLATE pg_catalog."default" NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text COLLATE pg_catalog."default" NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text COLLATE pg_catalog."default" GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT identities_pkey PRIMARY KEY (id),
    CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider)
);

ALTER TABLE IF EXISTS auth.identities
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.identities
    IS 'Auth: Almacena identidades asociadas a un usuario.';

COMMENT ON COLUMN auth.identities.email
    IS 'Auth: Email es una columna generada que referencia la propiedad opcional email en identity_data';

CREATE TABLE IF NOT EXISTS auth.instances
(
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text COLLATE pg_catalog."default",
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT instances_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.instances
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.instances
    IS 'Auth: Gestiona usuarios a través de múltiples sitios.';

CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims
(
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text COLLATE pg_catalog."default" NOT NULL,
    id uuid NOT NULL,
    CONSTRAINT amr_id_pk PRIMARY KEY (id),
    CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method)
);

ALTER TABLE IF EXISTS auth.mfa_amr_claims
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.mfa_amr_claims
    IS 'auth: almacena reclamos de referencia de método de autenticador para autenticación multifactor';

CREATE TABLE IF NOT EXISTS auth.mfa_challenges
(
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text COLLATE pg_catalog."default",
    web_authn_session_data jsonb,
    CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.mfa_challenges
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.mfa_challenges
    IS 'auth: almacena metadatos sobre solicitudes de desafíos realizadas';

CREATE TABLE IF NOT EXISTS auth.mfa_factors
(
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text COLLATE pg_catalog."default",
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text COLLATE pg_catalog."default",
    phone text COLLATE pg_catalog."default",
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb,
    CONSTRAINT mfa_factors_pkey PRIMARY KEY (id),
    CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at)
);

ALTER TABLE IF EXISTS auth.mfa_factors
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.mfa_factors
    IS 'auth: almacena metadatos sobre factores';

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data
    IS 'Almacena los últimos datos de desafío WebAuthn incluyendo atestación/afirmación para verificación del cliente';

CREATE TABLE IF NOT EXISTS auth.oauth_authorizations
(
    id uuid NOT NULL,
    authorization_id text COLLATE pg_catalog."default" NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text COLLATE pg_catalog."default" NOT NULL,
    scope text COLLATE pg_catalog."default" NOT NULL,
    state text COLLATE pg_catalog."default",
    resource text COLLATE pg_catalog."default",
    code_challenge text COLLATE pg_catalog."default",
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type NOT NULL DEFAULT 'code'::auth.oauth_response_type,
    status auth.oauth_authorization_status NOT NULL DEFAULT 'pending'::auth.oauth_authorization_status,
    authorization_code text COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:03:00'::interval),
    approved_at timestamp with time zone,
    nonce text COLLATE pg_catalog."default",
    CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id),
    CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code),
    CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id)
);

CREATE TABLE IF NOT EXISTS auth.oauth_client_states
(
    id uuid NOT NULL,
    provider_type text COLLATE pg_catalog."default" NOT NULL,
    code_verifier text COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE auth.oauth_client_states
    IS 'Almacena estados OAuth para flujos de autenticación de proveedores terceros donde Supabase actúa como el cliente OAuth.';

CREATE TABLE IF NOT EXISTS auth.oauth_clients
(
    id uuid NOT NULL,
    client_secret_hash text COLLATE pg_catalog."default",
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text COLLATE pg_catalog."default" NOT NULL,
    grant_types text COLLATE pg_catalog."default" NOT NULL,
    client_name text COLLATE pg_catalog."default",
    client_uri text COLLATE pg_catalog."default",
    logo_uri text COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type NOT NULL DEFAULT 'confidential'::auth.oauth_client_type,
    CONSTRAINT oauth_clients_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth.oauth_consents
(
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text COLLATE pg_catalog."default" NOT NULL,
    granted_at timestamp with time zone NOT NULL DEFAULT now(),
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_pkey PRIMARY KEY (id),
    CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id)
);

CREATE TABLE IF NOT EXISTS auth.one_time_tokens
(
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text COLLATE pg_catalog."default" NOT NULL,
    relates_to text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.one_time_tokens
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS auth.refresh_tokens
(
    instance_id uuid,
    id bigserial NOT NULL,
    token character varying(255) COLLATE pg_catalog."default",
    user_id character varying(255) COLLATE pg_catalog."default",
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255) COLLATE pg_catalog."default",
    session_id uuid,
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT refresh_tokens_token_unique UNIQUE (token)
);

ALTER TABLE IF EXISTS auth.refresh_tokens
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.refresh_tokens
    IS 'Auth: Almacén de tokens usados para refrescar tokens JWT una vez que expiran.';

CREATE TABLE IF NOT EXISTS auth.saml_providers
(
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text COLLATE pg_catalog."default" NOT NULL,
    metadata_xml text COLLATE pg_catalog."default" NOT NULL,
    metadata_url text COLLATE pg_catalog."default",
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text COLLATE pg_catalog."default",
    CONSTRAINT saml_providers_pkey PRIMARY KEY (id),
    CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id)
);

ALTER TABLE IF EXISTS auth.saml_providers
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.saml_providers
    IS 'Auth: Gestiona conexiones de Proveedores de Identidad SAML.';

CREATE TABLE IF NOT EXISTS auth.saml_relay_states
(
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text COLLATE pg_catalog."default" NOT NULL,
    for_email text COLLATE pg_catalog."default",
    redirect_to text COLLATE pg_catalog."default",
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.saml_relay_states
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.saml_relay_states
    IS 'Auth: Contiene información de Estado de Retransmisión SAML para cada inicio de sesión iniciado por el Proveedor de Servicios.';

CREATE TABLE IF NOT EXISTS auth.schema_migrations
(
    version character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);

ALTER TABLE IF EXISTS auth.schema_migrations
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.schema_migrations
    IS 'Auth: Gestiona actualizaciones al sistema de auth.';

CREATE TABLE IF NOT EXISTS auth.sessions
(
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text COLLATE pg_catalog."default",
    ip inet,
    tag text COLLATE pg_catalog."default",
    oauth_client_id uuid,
    refresh_token_hmac_key text COLLATE pg_catalog."default",
    refresh_token_counter bigint,
    scopes text COLLATE pg_catalog."default",
    CONSTRAINT sessions_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.sessions
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.sessions
    IS 'Auth: Almacena datos de sesión asociados a un usuario.';

COMMENT ON COLUMN auth.sessions.not_after
    IS 'Auth: Not after es una columna anulable que contiene una marca de tiempo después de la cual la sesión debe considerarse expirada.';

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key
    IS 'Mantiene una clave HMAC-SHA256 usada para firmar tokens de refresco para esta sesión.';

COMMENT ON COLUMN auth.sessions.refresh_token_counter
    IS 'Mantiene el ID (contador) del último token de refresco emitido.';

CREATE TABLE IF NOT EXISTS auth.sso_domains
(
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT sso_domains_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.sso_domains
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.sso_domains
    IS 'Auth: Gestiona el mapeo de dominios de direcciones de correo SSO a un Proveedor de Identidad SSO.';

CREATE TABLE IF NOT EXISTS auth.sso_providers
(
    id uuid NOT NULL,
    resource_id text COLLATE pg_catalog."default",
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT sso_providers_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS auth.sso_providers
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.sso_providers
    IS 'Auth: Gestiona información del proveedor de identidad SSO; ver saml_providers para SAML.';

COMMENT ON COLUMN auth.sso_providers.resource_id
    IS 'Auth: Identifica de forma única un proveedor SSO según un ID de recurso elegido por el usuario (no sensible a mayúsculas), útil en infraestructura como código.';

CREATE TABLE IF NOT EXISTS auth.users
(
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255) COLLATE pg_catalog."default",
    role character varying(255) COLLATE pg_catalog."default",
    email character varying(255) COLLATE pg_catalog."default",
    encrypted_password character varying(255) COLLATE pg_catalog."default",
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255) COLLATE pg_catalog."default",
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255) COLLATE pg_catalog."default",
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255) COLLATE pg_catalog."default",
    email_change character varying(255) COLLATE pg_catalog."default",
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text COLLATE pg_catalog."default" DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text COLLATE pg_catalog."default" DEFAULT ''::character varying,
    phone_change_token character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) COLLATE pg_catalog."default" DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean NOT NULL DEFAULT false,
    deleted_at timestamp with time zone,
    is_anonymous boolean NOT NULL DEFAULT false,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_phone_key UNIQUE (phone)
);

ALTER TABLE IF EXISTS auth.users
    ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE auth.users
    IS 'Auth: Almacena datos de inicio de sesión de usuario dentro de un esquema seguro.';

COMMENT ON COLUMN auth.users.is_sso_user
    IS 'Auth: Establecer esta columna en verdadero cuando la cuenta proviene de SSO. Estas cuentas pueden tener correos duplicados.';

CREATE TABLE IF NOT EXISTS public.actividades
(
    id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    titulo character varying COLLATE pg_catalog."default" NOT NULL,
    descripcion text COLLATE pg_catalog."default",
    fecha date,
    hora time without time zone,
    prioridad character varying COLLATE pg_catalog."default",
    categoria character varying COLLATE pg_catalog."default",
    completada boolean DEFAULT false,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT actividades_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.agenda
(
    id_ag integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    id_cal integer NOT NULL,
    hora_i time without time zone NOT NULL,
    hora_f time without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT agenda_pkey PRIMARY KEY (id_ag)
);

CREATE TABLE IF NOT EXISTS public.calendario
(
    id_cal integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    nom character varying COLLATE pg_catalog."default" NOT NULL,
    descr text COLLATE pg_catalog."default",
    fecha date NOT NULL,
    lugar character varying COLLATE pg_catalog."default",
    prior integer NOT NULL DEFAULT 1,
    id_cat integer,
    id_recur integer,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT calendario_pkey PRIMARY KEY (id_cal)
);

CREATE TABLE IF NOT EXISTS public.categoria
(
    id_cat serial NOT NULL,
    nombre character varying(110) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT categoria_pkey PRIMARY KEY (id_cat)
);

CREATE TABLE IF NOT EXISTS public.categorias
(
    id_cat integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    nombre character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT categorias_pkey PRIMARY KEY (id_cat)
);

CREATE TABLE IF NOT EXISTS public.configuraciones
(
    id_config integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id uuid NOT NULL,
    notificaciones_email boolean DEFAULT true,
    notificaciones_push boolean DEFAULT true,
    recordatorios_habitos boolean DEFAULT true,
    recordatorios_eventos boolean DEFAULT true,
    hora_inicio_dia time without time zone DEFAULT '06:00:00'::time without time zone,
    meta_habitos_diaria integer DEFAULT 3,
    atajos_teclado boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT configuraciones_pkey PRIMARY KEY (id_config),
    CONSTRAINT configuraciones_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.habitos
(
    id_hab integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    nom character varying COLLATE pg_catalog."default" NOT NULL,
    descr text COLLATE pg_catalog."default",
    hora time without time zone NOT NULL,
    prior integer NOT NULL DEFAULT 1,
    user_id uuid,
    racha integer DEFAULT 0,
    progreso_semanal integer DEFAULT 0,
    completado_hoy boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT habitos_pkey PRIMARY KEY (id_hab)
);

CREATE TABLE IF NOT EXISTS public.notas
(
    id_notas integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    nom character varying COLLATE pg_catalog."default" NOT NULL,
    cont text COLLATE pg_catalog."default" NOT NULL,
    user_id uuid,
    imagen text COLLATE pg_catalog."default",
    estado_animo character varying COLLATE pg_catalog."default" DEFAULT 'sun'::character varying,
    favorita boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT notas_pkey PRIMARY KEY (id_notas)
);

CREATE TABLE IF NOT EXISTS public.usuarios
(
    id uuid NOT NULL,
    username text COLLATE pg_catalog."default",
    nombre text COLLATE pg_catalog."default",
    apellido text COLLATE pg_catalog."default",
    fecha_nacimiento date,
    genero text COLLATE pg_catalog."default",
    avatar text COLLATE pg_catalog."default" DEFAULT 'user-circle'::text,
    tema text COLLATE pg_catalog."default" DEFAULT 'default'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS realtime.messages
(
    topic text COLLATE pg_catalog."default" NOT NULL,
    extension text COLLATE pg_catalog."default" NOT NULL,
    payload jsonb,
    event text COLLATE pg_catalog."default",
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at)
);

ALTER TABLE IF EXISTS realtime.messages
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS realtime.schema_migrations
(
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone,
    CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);

CREATE TABLE IF NOT EXISTS realtime.subscription
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] NOT NULL DEFAULT '{}'::realtime.user_defined_filter[],
    claims jsonb NOT NULL,
    claims_role regrole NOT NULL GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED,
    created_at timestamp without time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT pk_subscription PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.buckets
(
    id text COLLATE pg_catalog."default" NOT NULL,
    name text COLLATE pg_catalog."default" NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[] COLLATE pg_catalog."default",
    owner_id text COLLATE pg_catalog."default",
    type storage.buckettype NOT NULL DEFAULT 'STANDARD'::storage.buckettype,
    CONSTRAINT buckets_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS storage.buckets
    ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN storage.buckets.owner
    IS 'El campo está obsoleto, usar owner_id en su lugar';

CREATE TABLE IF NOT EXISTS storage.buckets_analytics
(
    name text COLLATE pg_catalog."default" NOT NULL,
    type storage.buckettype NOT NULL DEFAULT 'ANALYTICS'::storage.buckettype,
    format text COLLATE pg_catalog."default" NOT NULL DEFAULT 'ICEBERG'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    deleted_at timestamp with time zone,
    CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS storage.buckets_analytics
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS storage.buckets_vectors
(
    id text COLLATE pg_catalog."default" NOT NULL,
    type storage.buckettype NOT NULL DEFAULT 'VECTOR'::storage.buckettype,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS storage.buckets_vectors
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS storage.migrations
(
    id integer NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    hash character varying(40) COLLATE pg_catalog."default" NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT migrations_pkey PRIMARY KEY (id),
    CONSTRAINT migrations_name_key UNIQUE (name)
);

ALTER TABLE IF EXISTS storage.migrations
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS storage.objects
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bucket_id text COLLATE pg_catalog."default",
    name text COLLATE pg_catalog."default",
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] COLLATE pg_catalog."default" GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text COLLATE pg_catalog."default",
    owner_id text COLLATE pg_catalog."default",
    user_metadata jsonb,
    level integer,
    CONSTRAINT objects_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS storage.objects
    ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN storage.objects.owner
    IS 'El campo está obsoleto, usar owner_id en su lugar';

CREATE TABLE IF NOT EXISTS storage.prefixes
(
    bucket_id text COLLATE pg_catalog."default" NOT NULL,
    name text COLLATE pg_catalog."C" NOT NULL,
    level integer NOT NULL GENERATED ALWAYS AS (storage.get_level(name)) STORED,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name)
);

ALTER TABLE IF EXISTS storage.prefixes
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads
(
    id text COLLATE pg_catalog."default" NOT NULL,
    in_progress_size bigint NOT NULL DEFAULT 0,
    upload_signature text COLLATE pg_catalog."default" NOT NULL,
    bucket_id text COLLATE pg_catalog."default" NOT NULL,
    key text COLLATE pg_catalog."C" NOT NULL,
    version text COLLATE pg_catalog."default" NOT NULL,
    owner_id text COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_metadata jsonb,
    CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS storage.s3_multipart_uploads
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads_parts
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    upload_id text COLLATE pg_catalog."default" NOT NULL,
    size bigint NOT NULL DEFAULT 0,
    part_number integer NOT NULL,
    bucket_id text COLLATE pg_catalog."default" NOT NULL,
    key text COLLATE pg_catalog."C" NOT NULL,
    etag text COLLATE pg_catalog."default" NOT NULL,
    owner_id text COLLATE pg_catalog."default",
    version text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS storage.s3_multipart_uploads_parts
    ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS storage.vector_indexes
(
    id text COLLATE pg_catalog."default" NOT NULL DEFAULT gen_random_uuid(),
    name text COLLATE pg_catalog."C" NOT NULL,
    bucket_id text COLLATE pg_catalog."default" NOT NULL,
    data_type text COLLATE pg_catalog."default" NOT NULL,
    dimension integer NOT NULL,
    distance_metric text COLLATE pg_catalog."default" NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT vector_indexes_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS storage.vector_indexes
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS identities_user_id_idx
    ON auth.identities(user_id);


ALTER TABLE IF EXISTS auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id)
    REFERENCES auth.sessions (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id)
    REFERENCES auth.mfa_factors (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS mfa_factors_user_id_idx
    ON auth.mfa_factors(user_id);


ALTER TABLE IF EXISTS auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id)
    REFERENCES auth.oauth_clients (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id)
    REFERENCES auth.oauth_clients (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS oauth_consents_active_client_idx
    ON auth.oauth_consents(client_id);


ALTER TABLE IF EXISTS auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id)
    REFERENCES auth.sessions (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id)
    REFERENCES auth.sso_providers (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS saml_providers_sso_provider_id_idx
    ON auth.saml_providers(sso_provider_id);


ALTER TABLE IF EXISTS auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id)
    REFERENCES auth.flow_state (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id)
    REFERENCES auth.sso_providers (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS saml_relay_states_sso_provider_id_idx
    ON auth.saml_relay_states(sso_provider_id);


ALTER TABLE IF EXISTS auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id)
    REFERENCES auth.oauth_clients (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS sessions_oauth_client_id_idx
    ON auth.sessions(oauth_client_id);


ALTER TABLE IF EXISTS auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS sessions_user_id_idx
    ON auth.sessions(user_id);


ALTER TABLE IF EXISTS auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id)
    REFERENCES auth.sso_providers (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS sso_domains_sso_provider_id_idx
    ON auth.sso_domains(sso_provider_id);


ALTER TABLE IF EXISTS public.actividades
    ADD CONSTRAINT actividades_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.agenda
    ADD CONSTRAINT agenda_id_cal_fkey FOREIGN KEY (id_cal)
    REFERENCES public.calendario (id_cal) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.calendario
    ADD CONSTRAINT calendario_id_cat_fkey FOREIGN KEY (id_cat)
    REFERENCES public.categorias (id_cat) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.calendario
    ADD CONSTRAINT calendario_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.configuraciones
    ADD CONSTRAINT configuraciones_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.usuarios (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS configuraciones_user_unique
    ON public.configuraciones(user_id);


ALTER TABLE IF EXISTS public.habitos
    ADD CONSTRAINT habitos_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.notas
    ADD CONSTRAINT notas_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.usuarios
    ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS usuarios_pkey
    ON public.usuarios(id);


ALTER TABLE IF EXISTS storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id)
    REFERENCES storage.buckets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id)
    REFERENCES storage.buckets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id)
    REFERENCES storage.buckets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id)
    REFERENCES storage.buckets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id)
    REFERENCES storage.s3_multipart_uploads (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id)
    REFERENCES storage.buckets_vectors (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

-- Add a JSONB column to store flexible frequency details
ALTER TABLE public.habitos 
ADD COLUMN IF NOT EXISTS frecuencia_config JSONB DEFAULT '{}'::jsonb;
-- Example of what will be stored:
-- Weekly: {"type": "weekly", "days": [1, 3, 5]}
-- Monthly: {"type": "monthly", "day": 15}
-- Yearly: {"type": "yearly", "month": 2, "day": 14}
-- Custom: {"type": "custom", "interval": 3}

END;
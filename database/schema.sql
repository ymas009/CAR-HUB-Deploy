CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_role (
    user_id UUID NOT NULL REFERENCES app_user(id),
    role_code VARCHAR(60) NOT NULL,
    PRIMARY KEY (user_id, role_code)
);

CREATE TABLE auth_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    ip_address VARCHAR(80),
    user_agent TEXT
);

CREATE INDEX idx_auth_session_user_active ON auth_session(user_id, revoked_at, expires_at);

CREATE TABLE customer_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES app_user(id),
    city VARCHAR(120),
    state VARCHAR(120),
    country VARCHAR(120),
    preferred_travel_type VARCHAR(80),
    emergency_contact_name VARCHAR(160),
    emergency_contact_mobile VARCHAR(32),
    consent_terms BOOLEAN NOT NULL DEFAULT false,
    consent_privacy BOOLEAN NOT NULL DEFAULT false,
    consent_controlled_data_sharing BOOLEAN NOT NULL DEFAULT false,
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE travel_package (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(160) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    destination VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    starting_price NUMERIC(12,2),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    duration_days INT NOT NULL,
    availability_status VARCHAR(40) NOT NULL DEFAULT 'AVAILABLE',
    image_url TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE package_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES app_user(id),
    package_id UUID REFERENCES travel_package(id),
    status VARCHAR(60) NOT NULL DEFAULT 'DRAFT',
    destination VARCHAR(180) NOT NULL,
    current_location VARCHAR(180) NOT NULL,
    travelers_count INT NOT NULL CHECK (travelers_count > 0),
    travel_start_date DATE NOT NULL,
    travel_end_date DATE NOT NULL,
    budget_min NUMERIC(12,2),
    budget_max NUMERIC(12,2),
    trip_type VARCHAR(80) NOT NULL,
    special_requirements TEXT,
    emergency_contact_name VARCHAR(160),
    emergency_contact_mobile VARCHAR(32),
    admin_internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_travel_dates CHECK (travel_end_date >= travel_start_date)
);

CREATE INDEX idx_package_request_customer ON package_request(customer_id);
CREATE INDEX idx_package_request_status ON package_request(status);
CREATE INDEX idx_package_request_dates ON package_request(travel_start_date, travel_end_date);

CREATE TABLE provider_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES app_user(id),
    business_name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(160) NOT NULL,
    business_address TEXT,
    service_locations TEXT,
    categories TEXT,
    verification_status VARCHAR(60) NOT NULL DEFAULT 'PENDING',
    quality_score NUMERIC(4,2) DEFAULT 0,
    complaint_count INT NOT NULL DEFAULT 0,
    suspended BOOLEAN NOT NULL DEFAULT false,
    document_expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE provider_assignment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES package_request(id),
    provider_id UUID NOT NULL REFERENCES provider_profile(id),
    status VARCHAR(60) NOT NULL DEFAULT 'FORWARDED_TO_PROVIDER',
    access_expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES app_user(id),
    assigned_by UUID NOT NULL REFERENCES app_user(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_assignment_provider_status ON provider_assignment(provider_id, status);
CREATE INDEX idx_provider_assignment_request ON provider_assignment(request_id);

CREATE TABLE provider_shared_payload (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL UNIQUE REFERENCES provider_assignment(id),
    approved_by UUID NOT NULL REFERENCES app_user(id),
    visible_fields TEXT NOT NULL,
    masked_payload TEXT NOT NULL,
    purpose VARCHAR(160) NOT NULL,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES package_request(id),
    customer_id UUID REFERENCES app_user(id),
    assigned_to UUID REFERENCES app_user(id),
    category VARCHAR(80) NOT NULL,
    priority VARCHAR(40) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(60) NOT NULL DEFAULT 'OPEN',
    subject VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    sla_due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_ticket_status_priority ON support_ticket(status, priority);

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES package_request(id),
    customer_id UUID NOT NULL REFERENCES app_user(id),
    package_rating INT CHECK (package_rating BETWEEN 1 AND 5),
    support_rating INT CHECK (support_rating BETWEEN 1 AND 5),
    comment TEXT,
    moderation_status VARCHAR(60) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES app_user(id),
    actor_role VARCHAR(80),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    action VARCHAR(100) NOT NULL,
    previous_state VARCHAR(80),
    new_state VARCHAR(80),
    reason TEXT,
    metadata TEXT,
    ip_address VARCHAR(80),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

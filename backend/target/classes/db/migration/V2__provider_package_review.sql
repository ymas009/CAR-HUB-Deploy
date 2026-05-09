ALTER TABLE travel_package
    ADD COLUMN source_provider_id UUID REFERENCES provider_profile(id),
    ADD COLUMN submitted_by UUID REFERENCES app_user(id),
    ADD COLUMN reviewed_by UUID REFERENCES app_user(id),
    ADD COLUMN review_notes TEXT,
    ADD COLUMN submitted_at TIMESTAMPTZ,
    ADD COLUMN reviewed_at TIMESTAMPTZ;

CREATE INDEX idx_travel_package_status_created ON travel_package(availability_status, created_at DESC);
CREATE INDEX idx_travel_package_provider_created ON travel_package(source_provider_id, created_at DESC);

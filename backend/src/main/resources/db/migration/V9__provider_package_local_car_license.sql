ALTER TABLE travel_package
    ADD COLUMN IF NOT EXISTS local_places TEXT,
    ADD COLUMN IF NOT EXISTS car_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS license_number VARCHAR(80),
    ADD COLUMN IF NOT EXISTS license_holder_name VARCHAR(160),
    ADD COLUMN IF NOT EXISTS license_details TEXT;

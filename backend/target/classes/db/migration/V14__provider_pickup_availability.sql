ALTER TABLE travel_package
    ADD COLUMN IF NOT EXISTS pickup_availability_mode VARCHAR(20) DEFAULT 'ALWAYS',
    ADD COLUMN IF NOT EXISTS pickup_start_time VARCHAR(5),
    ADD COLUMN IF NOT EXISTS pickup_end_time VARCHAR(5);

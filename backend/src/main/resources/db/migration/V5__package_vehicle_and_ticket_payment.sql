ALTER TABLE travel_package
    ADD COLUMN car_photo_url TEXT,
    ADD COLUMN car_number VARCHAR(40),
    ADD COLUMN car_model VARCHAR(120),
    ADD COLUMN car_color VARCHAR(80),
    ADD COLUMN seats_available INT,
    ADD COLUMN provider_notes TEXT;

ALTER TABLE tickets
    ADD COLUMN pickup_location VARCHAR(220),
    ADD COLUMN pickup_date DATE,
    ADD COLUMN pickup_time VARCHAR(40),
    ADD COLUMN payment_reference VARCHAR(80),
    ADD COLUMN provider_mobile_snapshot VARCHAR(32),
    ADD COLUMN car_photo_url TEXT,
    ADD COLUMN car_number VARCHAR(40),
    ADD COLUMN car_model VARCHAR(120),
    ADD COLUMN car_color VARCHAR(80);

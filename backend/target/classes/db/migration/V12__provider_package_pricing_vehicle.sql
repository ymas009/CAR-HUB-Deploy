ALTER TABLE travel_package
    ADD COLUMN distance_km NUMERIC(10, 2),
    ADD COLUMN price_per_km NUMERIC(10, 2),
    ADD COLUMN provider_payout NUMERIC(12, 2);

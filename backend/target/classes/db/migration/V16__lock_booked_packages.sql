UPDATE travel_package
SET availability_status = 'BOOKED',
    featured = false,
    updated_at = now()
WHERE EXISTS (
    SELECT 1
    FROM tickets
    WHERE tickets.package_id = travel_package.id
);

CREATE INDEX IF NOT EXISTS idx_travel_package_public_visibility
    ON travel_package (availability_status, featured, title);

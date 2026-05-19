CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES app_user(id),
    package_id UUID NOT NULL REFERENCES travel_package(id),
    provider_id UUID NOT NULL REFERENCES provider_profile(id),
    car_type VARCHAR(20) NOT NULL,
    travellers_count INT NOT NULL CHECK (travellers_count BETWEEN 1 AND 6),
    travellers_details JSONB NOT NULL,
    special_requests TEXT,
    masked_customer_ref VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'BOOKED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_provider_id ON tickets(provider_id);
CREATE INDEX idx_tickets_package_id ON tickets(package_id);

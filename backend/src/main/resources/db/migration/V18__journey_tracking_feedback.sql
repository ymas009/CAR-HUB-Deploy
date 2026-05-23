ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS provider_latitude VARCHAR(40),
    ADD COLUMN IF NOT EXISTS provider_longitude VARCHAR(40),
    ADD COLUMN IF NOT EXISTS provider_location_updated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS journey_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completion_otp VARCHAR(12),
    ADD COLUMN IF NOT EXISTS completion_otp_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE feedback
    ALTER COLUMN request_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES tickets(id),
    ADD COLUMN IF NOT EXISTS provider_rating INT CHECK (provider_rating BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS idx_tickets_status_location
    ON tickets(status, provider_location_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_ticket_customer
    ON feedback(ticket_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_feedback_moderation_status
    ON feedback(moderation_status, created_at DESC);

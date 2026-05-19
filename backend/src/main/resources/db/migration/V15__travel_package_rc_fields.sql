ALTER TABLE travel_package
    ADD COLUMN IF NOT EXISTS rc_number       VARCHAR(60),
    ADD COLUMN IF NOT EXISTS rc_document_url TEXT;

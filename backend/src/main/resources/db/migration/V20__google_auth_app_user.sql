ALTER TABLE app_user ADD COLUMN google_id VARCHAR(255);

ALTER TABLE app_user ALTER COLUMN mobile DROP NOT NULL;

CREATE UNIQUE INDEX idx_app_user_google_id ON app_user(google_id) WHERE google_id IS NOT NULL;

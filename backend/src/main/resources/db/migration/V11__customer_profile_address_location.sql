ALTER TABLE customer_profile
  ADD COLUMN address TEXT,
  ADD COLUMN pin_code VARCHAR(16),
  ADD COLUMN latitude VARCHAR(40),
  ADD COLUMN longitude VARCHAR(40);

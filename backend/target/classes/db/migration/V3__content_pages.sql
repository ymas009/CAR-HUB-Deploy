CREATE TABLE content_page (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    contact_email VARCHAR(180),
    contact_phone VARCHAR(60),
    support_hours VARCHAR(160),
    published BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES app_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_page_slug_published ON content_page(slug, published);

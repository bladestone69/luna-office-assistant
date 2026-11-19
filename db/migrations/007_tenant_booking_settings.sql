ALTER TABLE clients ADD COLUMN IF NOT EXISTS notification_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS clients_slug_unique ON clients(slug) WHERE slug IS NOT NULL;

ALTER TABLE practice_profiles ADD COLUMN IF NOT EXISTS opening_hour integer NOT NULL DEFAULT 8;
ALTER TABLE practice_profiles ADD COLUMN IF NOT EXISTS closing_hour integer NOT NULL DEFAULT 17;

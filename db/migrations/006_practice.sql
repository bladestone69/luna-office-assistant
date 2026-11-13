CREATE TABLE IF NOT EXISTS practice_profiles (
  client_id uuid PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  trade text NOT NULL DEFAULT 'custom',
  visit_types text NOT NULL DEFAULT '[]',
  questions text NOT NULL DEFAULT '[]',
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS answers text;


ALTER TABLE clients ADD COLUMN IF NOT EXISTS notification_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS clients_slug_unique ON clients(slug) WHERE slug IS NOT NULL;

ALTER TABLE practice_profiles ADD COLUMN IF NOT EXISTS opening_hour integer NOT NULL DEFAULT 8;
ALTER TABLE practice_profiles ADD COLUMN IF NOT EXISTS closing_hour integer NOT NULL DEFAULT 17;

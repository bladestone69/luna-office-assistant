CREATE TABLE IF NOT EXISTS practice_profiles (
  client_id uuid PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  trade text NOT NULL DEFAULT 'custom',
  visit_types text NOT NULL DEFAULT '[]',
  questions text NOT NULL DEFAULT '[]',
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS answers text;

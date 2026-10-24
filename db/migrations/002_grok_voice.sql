ALTER TABLE hume_agents ADD COLUMN IF NOT EXISTS voice_provider text DEFAULT 'grok';
ALTER TABLE hume_agents ADD COLUMN IF NOT EXISTS grok_voice text DEFAULT 'eve';
ALTER TABLE hume_agents ADD COLUMN IF NOT EXISTS grok_instructions text;

CREATE TABLE IF NOT EXISTS grok_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  phone_number text NOT NULL UNIQUE,
  xai_phone_number_id text,
  webhook_secret text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS grok_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  body text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_grok_prompts_client ON grok_prompts(client_id);

ALTER TABLE grok_prompts ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'call';

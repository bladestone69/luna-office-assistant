ALTER TABLE tasks ADD COLUMN IF NOT EXISTS call_phone text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS place_call boolean NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS call_error text;

CREATE TABLE IF NOT EXISTS call_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  phone text NOT NULL,
  instruction text NOT NULL,
  armed_at timestamp NOT NULL DEFAULT now(),
  used_at timestamp
);

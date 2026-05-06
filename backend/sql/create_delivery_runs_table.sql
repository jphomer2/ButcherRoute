-- ButcherRoute: delivery_runs table
-- Run in Supabase SQL editor after customers table is created

CREATE TABLE IF NOT EXISTS delivery_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date        DATE NOT NULL,
  run_label       TEXT NOT NULL DEFAULT 'Run A',
  stop_number     INTEGER NOT NULL,

  -- Customer link (nullable — unmatched orders allowed)
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,

  -- Order quantities
  cases           NUMERIC,
  pallets         NUMERIC,

  -- Flags
  is_priority     BOOLEAN DEFAULT FALSE,
  early_cutoff    TIME,
  large_load      BOOLEAN DEFAULT FALSE,

  -- Status: pending | tbc | delivered | skipped
  status          TEXT NOT NULL DEFAULT 'pending',
  order_notes     TEXT,

  -- Geo (copied from customer at time of run, for route optimisation)
  delivery_postcode TEXT,
  lat             NUMERIC,
  lng             NUMERIC,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_date ON delivery_runs (run_date);
CREATE INDEX IF NOT EXISTS idx_runs_customer ON delivery_runs (customer_id);

CREATE TRIGGER delivery_runs_updated_at
  BEFORE UPDATE ON delivery_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE delivery_runs ENABLE ROW LEVEL SECURITY;

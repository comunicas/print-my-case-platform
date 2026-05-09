
-- Add API sync columns to uploads
ALTER TABLE public.uploads
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS sync_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_summary jsonb;

-- Backfill existing rows as spreadsheet uploads
UPDATE public.uploads SET source = 'spreadsheet' WHERE source = 'manual';

-- Ensure single API card per (pdv, type, period)
CREATE UNIQUE INDEX IF NOT EXISTS uploads_api_pdv_type_period_unique
  ON public.uploads (pdv_id, type, period)
  WHERE source = 'api';


-- Add separate sidebar expanded columns for stock and marketing
ALTER TABLE public.preferences
ADD COLUMN IF NOT EXISTS sidebar_stock_expanded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sidebar_marketing_expanded boolean DEFAULT false;

-- Backfill: copy sidebar_reports_expanded to sidebar_stock_expanded
UPDATE public.preferences
SET sidebar_stock_expanded = COALESCE(sidebar_reports_expanded, false);

-- Marketing starts as false (no legacy data to backfill)
UPDATE public.preferences
SET sidebar_marketing_expanded = false;

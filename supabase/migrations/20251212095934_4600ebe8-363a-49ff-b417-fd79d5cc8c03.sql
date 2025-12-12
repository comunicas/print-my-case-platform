-- Add sidebar preference columns to preferences table
ALTER TABLE public.preferences 
ADD COLUMN IF NOT EXISTS sidebar_collapsed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sidebar_reports_expanded boolean DEFAULT false;
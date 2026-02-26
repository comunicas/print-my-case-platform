
ALTER TABLE public.financial_entries DROP CONSTRAINT IF EXISTS financial_entries_category_check;
ALTER TABLE public.financial_entries ADD CONSTRAINT financial_entries_category_check 
  CHECK (category IN ('deducoes', 'implantacao', 'fixas'));

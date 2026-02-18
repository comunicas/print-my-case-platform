
-- Corrigir FK de sales_records: NO ACTION → CASCADE
ALTER TABLE public.sales_records
  DROP CONSTRAINT IF EXISTS sales_records_pdv_id_fkey;
ALTER TABLE public.sales_records
  ADD CONSTRAINT sales_records_pdv_id_fkey
  FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE CASCADE;

-- Corrigir FK de stock_records: NO ACTION → CASCADE
ALTER TABLE public.stock_records
  DROP CONSTRAINT IF EXISTS stock_records_pdv_id_fkey;
ALTER TABLE public.stock_records
  ADD CONSTRAINT stock_records_pdv_id_fkey
  FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE CASCADE;

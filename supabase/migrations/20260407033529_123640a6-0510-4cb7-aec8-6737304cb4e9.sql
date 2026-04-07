ALTER TABLE public.pre_stock
ADD COLUMN allocated_pdv_id uuid REFERENCES public.pdvs(id) ON DELETE SET NULL;
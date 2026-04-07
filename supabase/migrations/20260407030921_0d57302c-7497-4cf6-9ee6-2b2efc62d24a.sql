ALTER TABLE public.pre_stock
ADD CONSTRAINT pre_stock_pdv_id_fkey
FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE SET NULL;
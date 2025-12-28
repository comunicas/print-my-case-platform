-- Atualizar RLS de sales_records para usar user_can_access_pdv
DROP POLICY IF EXISTS "Users can view sales" ON public.sales_records;

CREATE POLICY "Users can view sales" 
ON public.sales_records
FOR SELECT
USING (
  user_can_access_pdv(auth.uid(), pdv_id)
);

-- Atualizar RLS de stock_records para usar user_can_access_pdv
DROP POLICY IF EXISTS "Users can view stock" ON public.stock_records;

CREATE POLICY "Users can view stock" 
ON public.stock_records
FOR SELECT
USING (
  user_can_access_pdv(auth.uid(), pdv_id)
);

-- Atualizar RLS de uploads para usar user_can_access_pdv
DROP POLICY IF EXISTS "Users can view uploads" ON public.uploads;

CREATE POLICY "Users can view uploads" 
ON public.uploads
FOR SELECT
USING (
  user_can_access_pdv(auth.uid(), pdv_id)
);
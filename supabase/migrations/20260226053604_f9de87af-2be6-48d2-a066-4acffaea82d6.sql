CREATE OR REPLACE FUNCTION public.get_sales_date_range(p_pdv_ids uuid[] DEFAULT NULL)
RETURNS TABLE(min_date timestamptz, max_date timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    MIN(payment_date) as min_date,
    MAX(payment_date) as max_date
  FROM sales_records
  WHERE payment_date IS NOT NULL
    AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
$$;
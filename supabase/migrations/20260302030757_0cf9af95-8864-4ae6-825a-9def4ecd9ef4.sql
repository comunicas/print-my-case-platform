CREATE OR REPLACE FUNCTION public.get_dre_sales_summary(
  p_pdv_ids uuid[],
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE(faturamento numeric, deducoes numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(SUM(amount), 0) as faturamento,
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0) as deducoes
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status != 'Cancelled'
$$;
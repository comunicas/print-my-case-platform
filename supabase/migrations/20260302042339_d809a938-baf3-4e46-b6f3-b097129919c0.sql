
-- Drop e recriar RPC com novos campos
DROP FUNCTION IF EXISTS public.get_dre_sales_summary(uuid[], timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_dre_sales_summary(
  p_pdv_ids uuid[],
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE(faturamento numeric, deducoes numeric, sales_count bigint, card_revenue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(SUM(amount), 0) as faturamento,
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0) as deducoes,
    COUNT(*) as sales_count,
    COALESCE(SUM(CASE WHEN payment_method = 'creditCard' THEN amount ELSE 0 END), 0) as card_revenue
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status != 'Cancelled'
$$;

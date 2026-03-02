
CREATE OR REPLACE FUNCTION public.get_annual_dre_summary(
  p_pdv_ids uuid[],
  p_year integer
)
RETURNS TABLE(
  month_start date,
  faturamento numeric,
  deducoes numeric,
  sales_count bigint,
  card_revenue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    date_trunc('month', payment_date)::date as month_start,
    COALESCE(SUM(amount), 0) as faturamento,
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0) as deducoes,
    COUNT(*) as sales_count,
    COALESCE(SUM(CASE WHEN payment_method = 'creditCard' THEN amount ELSE 0 END), 0) as card_revenue
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= make_date(p_year, 1, 1)::timestamp
    AND payment_date < make_date(p_year + 1, 1, 1)::timestamp
    AND status != 'Cancelled'
  GROUP BY date_trunc('month', payment_date)
  ORDER BY month_start
$$;

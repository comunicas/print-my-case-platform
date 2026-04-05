
CREATE OR REPLACE FUNCTION public.get_dre_sales_summary(
  p_pdv_ids uuid[],
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS TABLE(faturamento numeric, deducoes numeric, sales_count bigint, card_revenue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0),
    COUNT(*),
    COALESCE(SUM(CASE WHEN payment_method IN ('Cartão de Crédito', 'Cartão de Débito') THEN amount ELSE 0 END), 0)
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status IN ('Concluído')
$$;

CREATE OR REPLACE FUNCTION public.get_annual_dre_summary(
  p_pdv_ids uuid[],
  p_year integer
)
RETURNS TABLE(month_start text, faturamento numeric, deducoes numeric, sales_count bigint, card_revenue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    to_char(date_trunc('month', payment_date), 'YYYY-MM-DD') AS month_start,
    COALESCE(SUM(amount), 0) AS faturamento,
    COALESCE(SUM(refund_amount), 0) AS deducoes,
    COUNT(*) AS sales_count,
    COALESCE(SUM(CASE WHEN payment_method IN ('Cartão de Crédito', 'Cartão de Débito') THEN amount ELSE 0 END), 0) AS card_revenue
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND EXTRACT(YEAR FROM payment_date) = p_year
    AND status IN ('Concluído')
  GROUP BY date_trunc('month', payment_date)
  ORDER BY date_trunc('month', payment_date)
$$;

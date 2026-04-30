REVOKE EXECUTE ON FUNCTION public.ai_match_knowledge(vector, int, float) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_stock_overview(uuid[], int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_stock_redistribution_suggestions(int, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_sales_summary(timestamptz, timestamptz, uuid[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_top_products(timestamptz, timestamptz, uuid[], int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_low_stock_alerts(int, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_pdv_comparison(timestamptz, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_purchases_summary(timestamptz, timestamptz, int) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_financial_summary(timestamptz, timestamptz) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.ai_match_knowledge(vector, int, float) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_stock_overview(uuid[], int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_stock_redistribution_suggestions(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_sales_summary(timestamptz, timestamptz, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_top_products(timestamptz, timestamptz, uuid[], int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_low_stock_alerts(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_pdv_comparison(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_purchases_summary(timestamptz, timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ai_get_financial_summary(timestamptz, timestamptz) TO authenticated;
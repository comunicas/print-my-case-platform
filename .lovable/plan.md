

## Correção: RPC `get_dre_sales_summary` Ainda Usa Blocklist

### Problema

A migration anterior corrigiu apenas `get_annual_dre_summary` (aba Resumo). A RPC `get_dre_sales_summary` (usada na aba DRE e no dashboard) **não foi alterada** e continua com `status != 'Cancelled'`.

| RPC | Status | Filtro atual |
|-----|--------|-------------|
| `get_annual_dre_summary` | Corrigida ✅ | `IN ('Completed','Pago','Concluído')` |
| `get_dre_sales_summary` | **Errada ❌** | `!= 'Cancelled'` |

Impacto no Boulevard Tatuapé: 137 registros inválidos (R$ 9.856) estão inflando a receita — 61 "Cancelado", 4 "Pendente", 3 "Refunded".

### Correção

**Migration SQL** — recriar `get_dre_sales_summary` com allowlist e incluir todos os payment_methods de cartão (igual ao `get_annual_dre_summary`):

```sql
CREATE OR REPLACE FUNCTION public.get_dre_sales_summary(
  p_pdv_ids uuid[], p_start_date timestamptz, p_end_date timestamptz
)
RETURNS TABLE(faturamento numeric, deducoes numeric, sales_count bigint, card_revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0),
    COUNT(*),
    COALESCE(SUM(CASE WHEN payment_method IN (
      'creditCard','debitCard','credit_card','debit_card',
      'Cartão de Crédito','Cartão de Débito'
    ) THEN amount ELSE 0 END), 0)
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status IN ('Completed', 'Pago', 'Concluído')
$$;
```

### Mudanças

- `status != 'Cancelled'` → `status IN ('Completed', 'Pago', 'Concluído')`
- `payment_method = 'creditCard'` → lista completa com variantes PT-BR (alinhado com `get_annual_dre_summary`)

### Resultado

Receita do DRE mensal e dashboard corrigida para os 3 PDVs. Sem alteração no frontend.


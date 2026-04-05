

## Plano de Correção Completa — Dividido em Etapas

### Estado Atual

| Item | Status |
|------|--------|
| RPC `get_dre_sales_summary` | ❌ Ainda usa `!= 'Cancelled'` e `= 'creditCard'` |
| RPC `get_annual_dre_summary` | ✅ Já corrigida com allowlist |
| Dados no banco (`payment_method`) | ❌ Valores crus: `creditCard`, `debitCard`, `pix` |
| Dados no banco (`status`) | ⚠️ Parcial: `Concluído`/`Cancelado`/`Pendente` (ok), mas RPC não filtra corretamente |
| Edge Function `ingest-revenue` | ❌ Ainda grava `creditCard` em vez de `Cartão de Crédito` |
| Edge Function `process-spreadsheet` | Precisa verificar normalização |
| Frontend `SalesRecordsTab` | ✅ Labels já mapeados |
| Vendas existem apenas para Boulevard Tatuapé | ⚠️ 143 registros (API). Outros PDVs: 0 vendas |

---

### Etapa 1 — Corrigir RPC `get_dre_sales_summary`

**Objetivo**: Financeiro (DRE mensal) e dashboard mostram receitas corretas.

**Migration SQL**: Recriar a função com allowlist de status e lista ampliada de payment_methods para `card_revenue`:

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

**Impacto**: 65 registros "Cancelado"/"Pendente" (R$ ~4.600) deixam de inflar receita. Sem alteração no frontend.

---

### Etapa 2 — Normalizar dados existentes no banco

Padronizar `payment_method` e `status` dos 143 registros para valores PT-BR canônicos:

```sql
UPDATE sales_records SET payment_method = 'Cartão de Crédito' WHERE payment_method IN ('creditCard', 'credit_card');
UPDATE sales_records SET payment_method = 'Cartão de Débito' WHERE payment_method IN ('debitCard', 'debit_card');
UPDATE sales_records SET payment_method = 'PIX' WHERE payment_method = 'pix';
UPDATE sales_records SET status = 'Concluído' WHERE status IN ('Completed', 'Pago');
```

---

### Etapa 3 — Normalizar Edge Function `ingest-revenue`

Atualizar os mapeamentos para gravar diretamente os valores PT-BR canônicos, eliminando a necessidade de mapear variantes no futuro.

---

### Etapa 4 — Verificar e normalizar `process-spreadsheet`

Garantir que planilhas de vendas também gravem os valores PT-BR canônicos.

---

### Etapa 5 — Simplificar RPCs e frontend

Após normalização completa, simplificar as RPCs para filtrar apenas valores canônicos e reduzir os mapeamentos no frontend.

---

### Etapa 6 — Rotina de limpeza de uploads antigos (opcional)

Criar mecanismo para manter apenas uploads de estoque mais recentes por PDV.

---

## Etapa 1 — Pronta para Aprovação

**Escopo**: Apenas a migration SQL para recriar `get_dre_sales_summary` com allowlist. Zero mudanças no frontend ou edge functions.


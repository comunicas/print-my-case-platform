

## Correção: Datas Falsas nos Registros da API

### Problema

A migration anterior corrigiu os `payment_method` e `status` numéricos corretamente, mas usou `UPDATE SET payment_date = now()` para os 69 registros com data NULL. Isso colocou a **mesma data falsa** (03/04/26 00:34) em todos eles — a data da execução da migration, não a data real da venda.

### Dados encontrados

- 69 registros com `payment_date = 2026-04-03 03:34:22` (data falsa)
- **Todos os 69** têm `order_time` com a data real da transação (ex: 2026-03-03, 2026-03-20, etc.)

### Correção

**1. Data fix (usando insert tool)** — Copiar `order_time` para `payment_date`

```sql
UPDATE sales_records 
SET payment_date = order_time 
WHERE source = 'api' 
  AND payment_date = '2026-04-03 03:34:22.409348+00'
  AND order_time IS NOT NULL;
```

**2. `supabase/functions/ingest-revenue/index.ts`** — Melhorar fallback de `payment_date`

Na construção do record, adicionar fallback em cascata: `payment_date` → `order_time` → `now()`:

```typescript
payment_date: parsePaymentDate(body.payment_date || body.order_time),
```

Assim, se a máquina não enviar `payment_date` mas enviar `order_time`, usamos o `order_time` como data de pagamento.

### Resultado

Os 69 registros passam a ter a data real da transação em vez da data da migration. Futuros registros sem `payment_date` usam `order_time` como fallback antes de cair em `now()`.




# Correcao de dados de vendas - PDV Tiete Plaza

## Problema 1: 71 registros duplicados

Existem 71 registros de `source = 'spreadsheet'` que duplicam registros ja existentes via `source = 'api'` com o mesmo `order_number` e `pdv_id`. Isso infla os calculos de receita no dashboard.

**Acao:** Deletar os 71 registros `spreadsheet` duplicados, mantendo os registros `api` como fonte primaria.

```sql
DELETE FROM sales_records
WHERE pdv_id = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'
  AND source = 'spreadsheet'
  AND order_number IN (
    SELECT order_number FROM sales_records
    WHERE pdv_id = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'
      AND source = 'api'
  );
```

## Problema 2: payment_date nulo em venda concluida

O registro `id = 5539ed51-6eef-432e-8cb6-12c4448a6866` (iPhone 15 Pro Max, R$ 6.990, status "Concluido") tem `payment_date = NULL`, mas possui `order_completion_time = 2026-02-21 21:16:56+00`.

**Acao:** Preencher `payment_date` com o valor de `order_completion_time`.

```sql
UPDATE sales_records
SET payment_date = '2026-02-21 21:16:56+00'
WHERE id = '5539ed51-6eef-432e-8cb6-12c4448a6866';
```

## Impacto

- Remove ~R$ 4.962 de receita inflada nos graficos
- Torna visivel a venda de R$ 6.990 nos filtros por data do dashboard
- Nenhuma alteracao de codigo necessaria -- apenas correcao de dados


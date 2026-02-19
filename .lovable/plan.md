
# Causa da Discrepância: Receita Global vs. Receita do Dashboard

## O Problema — Diagnóstico Técnico

A diferença entre "Receita Global" (R$ 58.269,02 / 818 transações) e "Receita" nos KPI Cards (R$ 39.285,39 / 547 transações) é causada por um **filtro de status ausente na query de globalMetrics**.

### Comparação direta das queries:

**Query dos KPI Cards (filtrada corretamente):**
```typescript
// linha ~119-132 useDashboard.ts
supabase
  .from("sales_records")
  .select("amount, refund_amount")
  .gte("payment_date", startDate.toISOString())
  .lte("payment_date", endDate.toISOString())
  .in("status", ["Completed", "Pago", "Concluído"])  // ← filtra apenas pagamentos bem-sucedidos
```

**Query dos globalMetrics (SEM filtro de status — linha 202):**
```typescript
supabase
  .from("sales_records")
  .select("amount, refund_amount")
  .gte("payment_date", startDate.toISOString())
  .lte("payment_date", endDate.toISOString())
  // ← sem .in("status", [...]) → inclui Cancelled, Cancelado, pendentes, etc.
```

### Por que os números divergem:

```
globalMetrics inclui:
  ✅ Completed / Pago / Concluído  → 547 transações  → R$ 39.285,39
  ❌ Cancelled / Canceled           → 262 transações  → R$ 18.913,80  (cancelamentos pré-pagamento)
  ❌ Outros status (pendentes, etc) → restante        → diferença residual
  ─────────────────────────────────────────────────────
  TOTAL globalMetrics               → 818 transações  → R$ 58.269,02
```

Isso explica exatamente os números na imagem: os **R$ 18.913,80 de Cancelamentos** visíveis na "Análise de Perdas" são incluídos indevidamente na "Receita Global".

O Ticket Médio Global (R$ 71,23) também fica incorreto como consequência, pois divide R$ 58.269,02 por 818 em vez de R$ 39.285,39 por 547.

## Correção

### Arquivo: `src/hooks/useDashboard.ts` — linha 202

Adicionar o mesmo `.in("status", ...)` da query principal:

```typescript
// ANTES (linha 202):
supabase
  .from("sales_records")
  .select("amount, refund_amount")
  .gte("payment_date", startDate.toISOString())
  .lte("payment_date", endDate.toISOString()),

// DEPOIS:
supabase
  .from("sales_records")
  .select("amount, refund_amount")
  .gte("payment_date", startDate.toISOString())
  .lte("payment_date", endDate.toISOString())
  .in("status", ["Completed", "Pago", "Concluído"]),
```

Esta é a **única mudança necessária** — uma linha adicionada — sem impacto em nenhum outro componente.

## Resultado Esperado Após a Correção

```
Visão Consolidada (Receita Global):  R$ 39.285,39   ✅ igual ao KPI Card
Visão Consolidada (Transações):      547             ✅ igual ao KPI Card
Ticket Médio Global:                 R$ 71,82        ✅ igual ao Ticket Médio dos KPI Cards
```

## Arquivo a Modificar

| Arquivo | Linha | Mudança |
|---|---|---|
| `src/hooks/useDashboard.ts` | 202 | Adicionar `.in("status", ["Completed", "Pago", "Concluído"])` na query de globalSalesResult |

Mudança cirúrgica de 1 linha, sem novos imports, sem impacto em banco de dados ou outros componentes.

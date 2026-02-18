
# Code Review Completo da Plataforma Print My Case

## Estado Atual Confirmado

O banco está limpo e saudável após as correções anteriores:

| Tabela | Registros | Status |
|---|---|---|
| uploads | 4 | Corretos (2 stock API + 2 revenue xlsx) |
| sales_records | 812 | Limpos (542 Completed, 262 Cancelled, 8 Refunded) |
| stock_records | 76 | Tiete (55 slots) + Tatuapé (23 slots via API) |
| stock_history | 8 | Snapshots agregados por marca/PDV |
| upload_anomalies | 3 | 3 iPhones R$6.990 do Tietê, persistidos corretamente |

---

## Problemas Identificados por Área

### 1. Duplicação de Lógica — Crítico

**Arquivo:** `supabase/functions/process-spreadsheet/index.ts` (linhas 871-947)

O cálculo de anomalias é executado **3 vezes separadas** no mesmo request:
- Linha 873-877: para calcular `uploadAnomalyCount`
- Linha 907-912: para montar a notificação
- Linha 943-946: para a resposta HTTP

Isso significa que `rows.map(mapSalesRow)` é chamado três vezes extras após o processamento principal, desperdiçando CPU e aumentando o tempo de resposta da função.

**Correção:** Calcular anomalias uma única vez, salvar em variável reutilizável.

---

### 2. Limite de Anomalias Inadequado — Funcional

**Arquivo:** `supabase/functions/process-spreadsheet/index.ts` (linha 33)

```typescript
const ANOMALY_THRESHOLDS = {
  maxSingleAmount: 500, // iPhone 14/15/16 Pro custam R$ 6.990
};
```

O limite atual de R$ 500 exclui transações legítimas de iPhones (R$ 6.990). Confirmado por 3 anomalias salvas no banco: iPhone 14 Pro, iPhone 15 Pro Max, iPhone 16.

**Correção:** Ajustar limite para R$ 10.000 ou adicionar uma lista de produtos que podem ter preços altos.

---

### 3. Bug de Contagem de Anomalias — Funcional

**Arquivo:** `supabase/functions/process-spreadsheet/index.ts` (linha 870-878)

```typescript
// PROBLEMA: recalcula do zero após já ter processado
let uploadAnomalyCount = 0;
if (upload.type === "sales") {
  const salesRecords = rows.map(row => mapSalesRow(row, pdvId, uploadId)).filter(Boolean);
  // Ignora cleanRecords já calculado acima
  uploadAnomalyCount = detectAmountAnomalies(validRecords as ...).length;
}
```

O `uploadAnomalyCount` gravado no banco usa uma variável recalculada e não o `anomalySkipped` já calculado no bloco principal. Isso cria inconsistência entre `anomaly_count` no upload e os registros reais em `upload_anomalies`.

---

### 4. Limite de Query sem Paginação — Performance

**Arquivo:** `src/hooks/useProductAnalytics.ts` (linha 50)

```typescript
.limit(10000);
```

A query de analytics de produto busca até 10.000 registros client-side e depois filtra em JavaScript. Com volume crescente, isso vai degradar. O problema é que o matching por produto é feito em JS (`filterSalesByProduct`) porque o `ilike` do Postgres não é preciso o suficiente. Deve ser documentado como limitação conhecida.

---

### 5. Filtro de Vendas no `useDashboard` não Respeita o `saleStatusFilter` — Funcional

**Arquivo:** `src/hooks/useDashboard.ts` (linhas 108-113)

O dashboard usa status hardcoded:
```typescript
.in("status", ["Completed", "Pago", "Concluído"]);
```

O `saleStatusFilter` do contexto `StockFiltersContext` foi implementado para a página de Estoque, mas o Dashboard não o consome — é um filtro local da página de Estoque. Isso é correto by design, mas deve ser documentado claramente. Os dois módulos têm filtros independentes. Nenhum bug, mas falta clareza.

---

### 6. Lógica de `getSalesIndex` Duplicada — Manutenção

**Arquivo:** `src/lib/dashboardUtils.ts` (linha 336)

```typescript
function getSalesIndex(count: number): 'high' | 'medium' | 'low' | 'none' {
  // ...mesma implementação que em stockUtils.ts
}
```

A função `getSalesIndex` existe duas vezes: uma em `src/lib/stockUtils.ts` (exportada) e outra em `src/lib/dashboardUtils.ts` (privada, não exportada). Qualquer alteração nos thresholds precisa ser feita em dois lugares.

**Correção:** Remover a versão duplicada de `dashboardUtils.ts` e importar de `stockUtils.ts`.

---

### 7. Filtros de Upload com Paginação Inconsistente — UX

**Arquivo:** `src/pages/Uploads.tsx` (linha 80-93)

Os filtros de busca, PDV, tipo e status são aplicados **client-side** sobre os dados já paginados. Isso significa que se há 100 uploads e o usuário está na página 1 (50 registros), filtrar por "Tietê" pode retornar 0 resultados mesmo havendo uploads na página 2.

**Correção:** Mover os filtros para a query do `useUploads` (server-side), passando como parâmetros.

---

### 8. MAX_CAPACITY Importado de Dois Lugares — Manutenção

**Arquivo:** `src/components/stock/ProductDetailModal.tsx` (linha 11)

```typescript
import { MAX_CAPACITY } from '@/lib/stockGridUtils';
```

`MAX_CAPACITY` é definido em `stockGridUtils.ts` e `MAX_CAPACITY` (como `MAX_CAPACITY = 7`) também existe em `stockTypes.ts`. O `ProductDetailModal` importa de `stockGridUtils` enquanto `stockUtils.ts` importa de `stockTypes.ts`. Deveria existir em apenas um lugar.

---

### 9. Falta de Feedback Visual no Filtro de Status de Venda — UX

**Arquivo:** `src/components/stock/StockFilters.tsx`

O novo filtro `saleStatusFilter` está funcional, mas não tem nenhuma indicação visual de que está ativo no modo padrão ("Concluídas"). Um usuário pode não perceber que o estoque está calculando índices apenas com vendas concluídas, ignorando cancelamentos.

**Melhoria:** Adicionar um badge ou tooltip explicando o que o filtro faz e qual o padrão ativo.

---

### 10. Processo de Exclusão de Upload não Limpa `stock_history` — Bug

**Arquivo:** `src/hooks/useUploads.ts` (linha 222-235)

Quando um upload de estoque é excluído, o código deleta os `stock_records` mas **não deleta** as entradas correspondentes em `stock_history`:

```typescript
if (upload.type === "sales") {
  // deleta sales_records
} else {
  // deleta stock_records
  // FALTA: deletar stock_history onde upload_id = uploadId
}
```

Isso deixa snapshots órfãos no `stock_history`, corrompendo os gráficos de histórico.

---

### 11. Filtro de Cancelamento no Dashboard pode Perder Dados — Funcional

**Arquivo:** `src/hooks/useDashboard.ts` (linhas 142-150)

```typescript
.or("status.ilike.%cancelled%,status.ilike.%canceled%");
```

O filtro usa `ilike` para cancelamentos mas usa `in` para completados. Os status "Cancelado" (português) não contém "cancelled" nem "canceled", portanto cancelamentos da planilha brasileira podem não ser contados corretamente nos KPIs de cancelamento.

**Verificação:** Os dados mostram 262 registros com status "Cancelled" (inglês), então para o dataset atual funciona. Mas se a planilha vier com "Cancelado" (português), esses registros serão contados como vendas completadas.

---

### 12. Edge Function `ingest-stock` com Lógica de Filtragem Incorreta para "OUTROS" — Bug

**Arquivo:** `supabase/functions/ingest-stock/index.ts` (linhas 109-120)

```typescript
// Para OUTROS, filtrar manualmente os que não são de marcas conhecidas
const filteredRecords = brand === "OUTROS"
  ? (brandRecords ?? []).filter(r => {
      const upper = (r as any).product_name?.toUpperCase() ?? "";
      return !knownBrands.some(...)
    })
  : (brandRecords ?? []);
```

Quando `brand === "OUTROS"`, a query `ilike` usa `""` (string vazia), retornando **todos os produtos** do PDV, não apenas os "OUTROS". O filtro JS então tenta excluir as marcas conhecidas, mas isso é ineficiente e propenso a erros.

**Correção:** Para "OUTROS", buscar todos os registros e filtrar, ou melhorar a estratégia de query.

---

## Plano de Implementação

### Fase 1 — Correções Críticas (bugs que afetam dados)

**1.1 Ajustar limite de anomalias de R$ 500 → R$ 10.000**
- Arquivo: `supabase/functions/process-spreadsheet/index.ts`
- Alterar `maxSingleAmount: 500` para `maxSingleAmount: 10000`
- Benefício: Os 3 iPhones do Tietê (R$6.990) serão incluídos nas análises

**1.2 Corrigir duplicação de cálculo de anomalias**
- Arquivo: `supabase/functions/process-spreadsheet/index.ts`
- Extrair resultado de anomalias para variável no bloco principal
- Reutilizar em: `uploadAnomalyCount`, notificação e resposta
- Reduz 3 chamadas extras de `mapSalesRow`

**1.3 Corrigir exclusão de upload que não limpa `stock_history`**
- Arquivo: `src/hooks/useUploads.ts`
- Adicionar `DELETE FROM stock_history WHERE upload_id = uploadId` no fluxo de exclusão de estoque

**1.4 Corrigir filtro de cancelamentos no dashboard**
- Arquivo: `src/hooks/useDashboard.ts`
- Adicionar `status.ilike.%cancelado%` ao `or()` para capturar cancelamentos em português

---

### Fase 2 — Refatoração e Limpeza (qualidade de código)

**2.1 Eliminar `getSalesIndex` duplicada**
- Arquivo: `src/lib/dashboardUtils.ts`
- Remover a implementação local e importar de `stockUtils.ts`

**2.2 Unificar `MAX_CAPACITY`**
- Arquivo: `src/components/stock/ProductDetailModal.tsx`
- Mudar import de `stockGridUtils` para `stockTypes`
- Garantir um único ponto de verdade

**2.3 Corrigir query "OUTROS" no `ingest-stock`**
- Arquivo: `supabase/functions/ingest-stock/index.ts`
- Separar a lógica: buscar todos os registros do PDV e agrupar por marca em memória, em vez de uma query por marca com ilike

---

### Fase 3 — Melhorias de UX e Performance

**3.1 Mover filtros de uploads para server-side**
- Arquivo: `src/hooks/useUploads.ts` e `src/pages/Uploads.tsx`
- Adicionar parâmetros `pdvId`, `type`, `status`, `search` na query
- Corrige inconsistência de paginação com filtros

**3.2 Melhorar feedback do filtro `saleStatusFilter`**
- Arquivo: `src/components/stock/StockFilters.tsx`
- Adicionar tooltip explicando que o padrão "Concluídas" exclui cancelamentos/reembolsos dos índices de venda

**3.3 Documentar limite de 10.000 registros em `useProductAnalytics`**
- Arquivo: `src/hooks/useProductAnalytics.ts`
- Adicionar comentário explicando por que o matching é feito client-side e qual a limitação de escala

---

## Arquivos que Serão Alterados

| Arquivo | Tipo de Mudança |
|---|---|
| `supabase/functions/process-spreadsheet/index.ts` | Limite anomalia, deduplicação de cálculo |
| `supabase/functions/ingest-stock/index.ts` | Corrigir lógica "OUTROS" |
| `src/hooks/useUploads.ts` | Limpar stock_history na exclusão |
| `src/hooks/useDashboard.ts` | Filtro cancelamentos português |
| `src/lib/dashboardUtils.ts` | Remover getSalesIndex duplicada |
| `src/components/stock/ProductDetailModal.tsx` | Unificar import MAX_CAPACITY |
| `src/hooks/useUploads.ts` + `src/pages/Uploads.tsx` | Filtros server-side |
| `src/components/stock/StockFilters.tsx` | Tooltip no filtro de status de venda |

---

## Impacto nos Dados Atuais

- **3 iPhones R$6.990 do Tietê Plaza** vão ser incluídos nas vendas após o ajuste do limite
- Os dados de `upload_anomalies` permanecem (histórico mantido)
- Nenhum dado existente será apagado
- A lógica de anomalias continua funcionando para valores genuinamente anômalos

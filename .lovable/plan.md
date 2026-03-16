

## Análise da Página de Estoque — Problemas Encontrados e Correções

### Problema Principal: KPIs não refletem filtros ativos

Em `useProductStock.ts` linha 145, os KPIs são calculados a partir de `allProducts` (dados completos), **ignorando os filtros aplicados**. Quando o usuário filtra por status "Repor" (como na screenshot), os KPIs continuam mostrando os totais gerais em vez dos valores filtrados.

**Correção**: Calcular KPIs a partir de `filtered` (produtos já filtrados) em vez de `allProducts`. Manter um segundo conjunto de KPIs "globais" apenas para contexto se necessário, ou simplesmente refletir os filtros ativos.

### Detalhes Técnicos

**Arquivo: `src/hooks/useProductStock.ts`**

1. **Linha 145** — Trocar `calculateStockKPIs(allProducts, totalSlots)` por `calculateStockKPIs(filtered, totalSlots)` para que os KPIs reflitam os filtros de marca, status, busca e índice de vendas.

2. **Adicionar KPIs globais (opcional)** — Expor um `globalKpis` calculado com `allProducts` para que a página possa mostrar contexto (ex: "11 de 72 produtos" quando filtrado), mas o destaque principal deve ser dos filtrados.

### Comportamento Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Filtro "Repor" ativo | KPIs mostram 72 produtos, 669 unidades | KPIs mostram apenas os 11 produtos críticos com suas unidades |
| Filtro marca "Apple" | KPIs inalterados | KPIs refletem apenas produtos Apple |
| Sem filtros | Normal | Igual (sem mudança) |

### Sem dados mockados encontrados

Todos os dados vêm de queries reais ao banco (`stock_records` e `sales_records`). Não há mock data hardcoded.

### Resumo de impacto

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useProductStock.ts` | 1 linha: `allProducts` → `filtered` no cálculo de KPIs |

Nenhuma migration necessária.




# Limpeza de Legados e Ajustes no Estoque (Tabela + Mapa)

## Problemas Identificados

| # | Local | Problema |
|---|-------|----------|
| 1 | `StockGridView.tsx` | `EmptySlot` importado mas nunca usado (codigo morto) |
| 2 | `StockGridSkeleton.tsx` | Usa 10 blocos no skeleton, mas `MAX_CAPACITY` e 7 |
| 3 | `ProductStockTable.tsx` | Paginacao manual (~25 linhas) quando existe `DataPagination` reutilizavel |
| 4 | `StockLegend.tsx` | Cores de niveis hardcoded, duplicando `slotBlockColors` de `stockLabels.ts` |
| 5 | `SlotDetailModal.tsx` | Barra de progresso com thresholds hardcoded em vez de usar `getSlotVisualStatus` |
| 6 | `SlotStack.tsx` | Exporta `EmptySlot` que nao e usado por ninguem |

---

## Parte 1: Remover codigo morto

**`src/components/stock/StockGridView.tsx`**
- Remover import de `EmptySlot` (linha 4) — nao e usado

**`src/components/stock/SlotStack.tsx`**
- Remover export de `EmptySlot` (linhas 140-145) — componente morto, nunca usado

---

## Parte 2: Corrigir skeleton

**`src/components/stock/StockGridSkeleton.tsx`**
- Trocar `Array.from({ length: 10 })` por `Array.from({ length: MAX_CAPACITY })` (importar de `stockGridUtils`)
- Garante que o skeleton mostra a mesma quantidade de blocos que o slot real

---

## Parte 3: Usar DataPagination na tabela

**`src/components/stock/ProductStockTable.tsx`**
- Substituir a paginacao manual (linhas 296-320) pelo componente `DataPagination` que ja existe em `src/components/ui/data-pagination.tsx`
- Remover estado `page` manual e calculos de `totalPages`
- Usar as mesmas props padrao que Uploads ja usa
- Reducao: ~20 linhas

---

## Parte 4: Unificar cores na legenda

**`src/components/stock/StockLegend.tsx`**
- Importar `slotBlockColors` e `slotVisualLabels` de `stockLabels.ts`
- Substituir as 5 divs hardcoded por um loop sobre os status (full, medium, low/critical, empty, inactive)
- Mantem marcas como estao (ja usam `BrandLogo`)
- Reducao: ~15 linhas

---

## Parte 5: Unificar barra de progresso no SlotDetailModal

**`src/components/stock/SlotDetailModal.tsx`**
- Substituir thresholds hardcoded na barra de progresso (linhas 210-218) por reutilizacao de `getSlotVisualStatus` + mapeamento para cor CSS
- Usar `slotBlockColors` para determinar a cor da barra
- Mantem o mesmo visual, mas centraliza a logica

---

## Resumo de arquivos

| Acao   | Arquivo                              | Parte |
|--------|--------------------------------------|-------|
| Editar | `src/components/stock/StockGridView.tsx` | 1 |
| Editar | `src/components/stock/SlotStack.tsx`     | 1 |
| Editar | `src/components/stock/StockGridSkeleton.tsx` | 2 |
| Editar | `src/components/stock/ProductStockTable.tsx` | 3 |
| Editar | `src/components/stock/StockLegend.tsx`   | 4 |
| Editar | `src/components/stock/SlotDetailModal.tsx` | 5 |

## Beneficios

- Codigo morto removido (EmptySlot)
- Skeleton consistente com o componente real
- Paginacao padronizada via DataPagination
- Cores centralizadas em stockLabels (1 lugar para mudar)
- ~40 linhas de codigo duplicado/morto removidas


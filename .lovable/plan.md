

# Analise de Performance do Estoque + Proximos Passos do Projeto

## Parte 1: Performance da Pagina de Estoque

### O que ja esta bem feito
- `SlotStack` usa `React.memo` — evita re-render de ~40 slots quando apenas 1 muda
- `slotMap`, `productTotals`, `filteredSlotNumbers` estao em `useMemo`
- Handlers (`handleSlotClick`, `handleCloseModal`, `handleModalNavigate`) estao em `useCallback`
- `useProductStock` usa `useMemo` para agregar/filtrar produtos
- Queries com `staleTime: 5min` e `placeholderData` para evitar fetches desnecessarios

### Problemas identificados

| # | Problema | Impacto | Local |
|---|---------|---------|-------|
| 1 | **Inline arrow no onClick do SlotStack** | Cria nova funcao a cada render do grid, quebrando o `React.memo` do SlotStack. Com ~40 slots, sao ~40 funcoes novas a cada re-render | `StockGridView.tsx` L333 |
| 2 | **`StockFilters` nao e memoizado** | Recria arrays `statusOptions`, `salesIndexOptions`, `saleStatusOptions` a cada render. Sao constantes que nao mudam | `StockFilters.tsx` L53-73 |
| 3 | **`useProductStock` depende de `filters` objeto inteiro** | O `useMemo` principal (L86-150) tem `filters` como dependencia. Qualquer mudanca em qualquer filtro recalcula tudo, mesmo que o filtro alterado nao afete o calculo | `useProductStock.ts` L150 |
| 4 | **`ProductDetailModal` hardcoda thresholds de cor** | Barra de progresso (L210-216) usa thresholds hardcoded `20/50/70` em vez de `slotBlockColors` centralizado | `ProductDetailModal.tsx` L210 |
| 5 | **`StockKPICards` nao tem memo** | Componente leve mas re-renderiza com qualquer mudanca no parent | `StockKPICards.tsx` |

### Solucoes propostas

**1. Eliminar inline arrows no grid (maior impacto)**

Criar um wrapper memoizado para cada slot que encapsula o `onClick` com `useCallback` + `slotData` no closure, ou passar `slotData` como prop e usar callback estavel:

```typescript
// Trocar onClick={() => handleSlotClick(slotData)} por:
<SlotStack
  ...
  slotData={slotData}
  onSlotClick={handleSlotClick}  // referencia estavel via useCallback
/>
```

Atualizar `SlotStack` para receber `slotData` e chamar `onSlotClick(slotData)` internamente.

**2. Mover arrays estaticos para fora do componente**

```typescript
// Fora do componente StockFilters:
const STATUS_OPTIONS: SelectFilterOption[] = [...];
const SALES_INDEX_OPTIONS: SelectFilterOption[] = [...];
const SALE_STATUS_OPTIONS: SelectFilterOption[] = [...];
```

**3. Desestruturar filtros no useMemo**

Trocar a dependencia `filters` por campos individuais:
```typescript
}, [slots, salesByProduct, filters.searchTerm, filters.brandFilter, filters.statusFilter, filters.salesIndexFilter]);
```

**4. Unificar barra de progresso no ProductDetailModal**

Usar `getSlotVisualStatus` + `slotBlockColors` igual ao `SlotDetailModal` ja refatorado.

**5. Memo no StockKPICards**

Envolver com `React.memo` — componente puro, props simples.

### Arquivos a editar (Performance)

| Arquivo | Mudanca |
|---------|---------|
| `src/components/stock/StockGridView.tsx` | Remover inline arrows, passar slotData como prop |
| `src/components/stock/SlotStack.tsx` | Aceitar `slotData` + `onSlotClick` props |
| `src/components/stock/StockFilters.tsx` | Extrair arrays estaticos para fora |
| `src/hooks/useProductStock.ts` | Desestruturar filtros nas dependencias do useMemo |
| `src/components/stock/ProductDetailModal.tsx` | Usar slotBlockColors centralizado |
| `src/components/stock/StockKPICards.tsx` | Adicionar React.memo |
| `src/components/stock/StockLegend.tsx` | Adicionar React.memo |

---

## Parte 2: Proximos Passos de Refatoracao e UX

Apos analisar todo o projeto, identifiquei as seguintes oportunidades organizadas por prioridade:

### Alta Prioridade

| # | Area | Melhoria |
|---|------|---------|
| A1 | **Console warning** | `StockHistoryChart` gera warning de ref em `CartesianGrid`. Provavelmente precisa remover ref ou usar `forwardRef` no wrapper do recharts |
| A2 | **Testes unitarios** | `FilterBar`, `SearchFilter`, `SelectFilter` nao tem testes. Componentes base reutilizados em 4+ paginas precisam de cobertura |

### Media Prioridade

| # | Area | Melhoria |
|---|------|---------|
| M1 | **Marketing page** | Unica pagina que ainda nao migrou para os componentes `FilterBar`/`SelectFilter`/`SearchFilter` — verificar e migrar |
| M2 | **Settings page** | Mesma verificacao: `PDVsSettings`, `TeamSettings` podem ter filtros legados |
| M3 | **Export Excel** | O import de `exceljs` (~200KB) aparece nas dependencias. Verificar se ja esta com lazy loading ou se entra no bundle principal |

### Baixa Prioridade (nice-to-have)

| # | Area | Melhoria |
|---|------|---------|
| B1 | **Skeleton consistency** | Algumas paginas usam `Loader2` spinner em vez de skeleton shimmer. Padronizar UX de loading |
| B2 | **Error boundaries** | Nenhum error boundary encontrado. Um crash em qualquer chart derruba a pagina inteira |
| B3 | **Acessibilidade** | Tooltips no grid de estoque nao sao acionaveis por teclado em mobile |

### Sugestao de sequencia

1. Aplicar otimizacoes de performance do Estoque (esta proposta)
2. Corrigir warning do StockHistoryChart
3. Adicionar testes para componentes base de filtro
4. Verificar e migrar filtros em Marketing/Settings
5. Adicionar Error Boundaries nas paginas principais


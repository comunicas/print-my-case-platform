

## Remover filtro "Status da Venda" da página de Estoque

### Contexto

- O **filtro de índice de vendas** (Alta/Média/Baixa/Nenhuma) **já está no plano anterior** de correção de cores/legenda — não precisa de alteração adicional aqui.
- O **filtro "Status da Venda"** (Concluídas/Canceladas/Reembolsadas/Todas) será removido conforme solicitado.

### Alterações

**1. `src/components/stock/StockFilters.tsx`**
- Remover o bloco do "Sale Status Filter" (linhas 125-151): o `<SelectFilter>` + `<Tooltip>` + `<Info>` icon
- Remover imports não utilizados (`Info`, `Tooltip*`)
- Remover `SALE_STATUS_OPTIONS` (linhas 36-41)
- Remover `saleStatusFilter` e `setSaleStatusFilter` do destructuring

**2. `src/contexts/StockFiltersContext.tsx`**
- Remover `saleStatusFilter` do state, type, setters e `hasActiveFilters`
- Remover `SaleStatusFilter` type export
- Remover `setSaleStatusFilter` do contexto e do fallback

**3. `src/hooks/useProductStock.ts`**
- Hardcode o filtro de vendas para usar apenas status "completed" (`['Completed', 'Pago', 'Concluído']`) em vez de ler do filtro
- Remover `saleStatusFilter` da query key

### Resultado

O filtro de status de venda desaparece da UI. As métricas de vendas passam a considerar apenas vendas concluídas (comportamento padrão anterior). O filtro de índice de vendas (Alta/Média/Baixa) permanece inalterado.


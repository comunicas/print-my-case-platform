

## Nova aba "Dados" na página de Estoque — Tabelas de Vendas e Estoque por PDV

### Objetivo

Adicionar uma terceira aba na página de Estoque chamada **"Dados"** que exibe as tabelas brutas de vendas (`sales_records`) e estoque (`stock_records`) filtradas pelo PDV selecionado, com paginação.

### Layout

```text
[Tabela] [Mapa] [Dados]

Aba Dados:
┌─ Vendas ──────────────────────────────────────────┐
│ Data       │ Produto     │ Valor  │ Status │ Pgto  │
│ 21/03/2026 │ SAMSUNG X   │ R$299  │ Pago   │ Cartão│
│ ...        │ ...         │ ...    │ ...    │ ...   │
└───────────────────────────── Paginação ───────────┘

┌─ Estoque ─────────────────────────────────────────┐
│ Slot │ Produto       │ Qtd │ Ativo │ PDV          │
│ 01   │ SAMSUNG X     │ 5   │ ✓     │ PDV Tietê   │
│ ...  │ ...           │ ... │ ...   │ ...          │
└───────────────────────────── Paginação ───────────┘
```

### Alterações

**1. `src/hooks/usePDVSalesData.ts`** (novo)
- Hook que busca `sales_records` com filtro por PDV e `allowedPdvIds`
- Campos: `payment_date`, `product_name`, `amount`, `status`, `payment_method`, `order_number`
- Paginação server-side com `range()`
- Ordenação por `payment_date` desc

**2. `src/components/stock/PDVDataTab.tsx`** (novo)
- Componente com duas seções: "Vendas" e "Estoque"
- Tabela de vendas usa o hook `usePDVSalesData`
- Tabela de estoque reutiliza os `slots` já carregados (via props)
- Ambas com `DataPagination`
- Formatação: datas em pt-BR, valores em R$, status com badges coloridos

**3. `src/pages/Stock.tsx`** — Adicionar aba "Dados"
- Adicionar "dados" ao `VALID_TABS`
- Novo `TabsTrigger` e `TabsContent` renderizando `PDVDataTab`
- Passar `slots` e `selectedPdv` como props

**4. `src/components/stock/index.ts`** — Exportar `PDVDataTab`

### Dados

- Vendas: query direta em `sales_records` com filtro por `pdv_id`
- Estoque: reutiliza os `slots` já carregados pelo `useProductStock`
- Sem necessidade de alteração no banco


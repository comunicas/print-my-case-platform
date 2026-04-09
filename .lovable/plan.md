

## Ranking de Modelos Agrupados na Aba Compras

### Resumo

Adicionar uma visualização alternativa (toggle Tabela/Ranking) na aba Compras que agrupa os itens por modelo, mostrando um ranking ordenado por quantidade pendente.

### Visualização

O ranking será uma lista de cards horizontais com barra de progresso, mostrando:
- Posição no ranking (#1, #2...)
- Nome do modelo + logo da marca
- Quantidade pendente (restante) vs comprada (total)
- Valor pendente do modelo
- Barra de progresso visual (pendente/alocado)

```text
┌─────────────────────────────────────────────────┐
│ #1  [logo] iPhone 11          12 un. │ R$ 180  │
│     ████████████░░░░  (8 pendentes / 4 alocados)│
├─────────────────────────────────────────────────┤
│ #2  [logo] Galaxy S24          8 un. │ R$ 120  │
│     ██████████░░░░░░  (6 pendentes / 2 alocados)│
└─────────────────────────────────────────────────┘
```

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/upload/PreStockRanking.tsx` | **Novo** — Componente de ranking agrupado por modelo |
| `src/components/upload/PreStockTab.tsx` | Adicionar toggle Tabela/Ranking e renderizar o componente adequado |

### Detalhes técnicos

**PreStockRanking.tsx**:
- Recebe `items: PreStockItem[]` do hook existente
- Agrupa por `product_name` usando `reduce`, somando `quantity`, `remaining_quantity` e calculando valor pendente (`remaining_quantity * unit_cost`)
- Ordena por `remaining_quantity` desc (ranking)
- Usa `extractBrandFromProductName` + `BrandLogo` para ícone da marca
- Barra de progresso colorida: verde para alocado, amarelo para pendente
- Responsivo: cards empilhados no mobile

**PreStockTab.tsx**:
- Adicionar estado `viewMode: 'table' | 'ranking'`
- Toggle com ícones (TableIcon / BarChart3) ao lado do botão "Registrar Compra"
- Quando `viewMode === 'ranking'`, renderizar `<PreStockRanking items={items} />` no lugar da tabela


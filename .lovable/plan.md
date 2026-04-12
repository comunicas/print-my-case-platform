

## Exibir Quantidade Disponível em Compras na Tabela de Estoque

### Objetivo
Adicionar uma coluna "Compras" na tabela de estoque que mostra a quantidade pendente (remaining_quantity) de cada produto no pré-estoque, permitindo ao usuário saber rapidamente se já existe reposição comprada para aquele item.

### Mudanças

**1. `src/hooks/useProductStock.ts` — buscar dados de pré-estoque pendente**
- Adicionar query para buscar itens `pre_stock` com `status = 'pending'` agrupados por `product_name`
- Criar um Map `preStockByProduct` com a soma de `remaining_quantity` por produto (normalizado)
- Passar esse Map para o retorno do hook

**2. `src/lib/stockUtils.ts` — adicionar campo `preStockQuantity` ao tipo `ProductStock`**
- Adicionar `preStockQuantity: number` à interface `ProductStock`
- Preencher o campo nas funções `aggregateProductStock` e `aggregateProductStockByPdv` usando o Map recebido como parâmetro opcional

**3. `src/components/stock/ProductStockTable.tsx` — exibir coluna "Compras"**
- Adicionar coluna "Compras" entre "Estoque" e "Slots" (desktop)
- Exibir badge com quantidade pendente quando > 0, ou "—" quando 0
- Badge verde/azul com ícone de caixa para indicar unidades disponíveis para alocação
- No layout mobile (cards), exibir a informação de compras ao lado do estoque quando disponível

**4. `src/pages/StockTable.tsx` — passar dados de pré-estoque**
- Já disponível via `useProductStock`, sem mudança necessária neste arquivo

### Visualização esperada
- Coluna "Compras" mostra ex: `📦 5` quando há 5 unidades pendentes no pré-estoque para aquele produto
- Quando não há compras pendentes, exibe "—"
- Tooltip explicando: "X unidades disponíveis em compras para alocação"

### Arquivos afetados
- `src/lib/stockUtils.ts` — tipo ProductStock + funções de agregação
- `src/hooks/useProductStock.ts` — query de pré-estoque + Map
- `src/components/stock/ProductStockTable.tsx` — coluna visual


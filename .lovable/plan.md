

## Unificar Busca: Usar ProductSearchAutocomplete na Página de Compras

### Problema
A Tabela de Estoque tem busca com autocomplete rico (sugestões com logo de marca, highlight, "Mais vendidos"), enquanto Compras usa um campo de texto simples. A experiência deveria ser consistente.

### Solução
Adaptar o `ProductSearchAutocomplete` para aceitar sugestões genéricas, e alimentá-lo com os produtos do pré-estoque na página de Compras.

### Mudanças

**1. `src/components/stock/ProductSearchAutocomplete.tsx`**
- Adicionar prop opcional `suggestions` externa para permitir uso fora do contexto de StockFilters
- Adicionar prop opcional `onValueChange` como alternativa ao dispatch do contexto
- Quando `suggestions` é fornecido externamente, usar essas ao invés de ler do contexto

**2. `src/components/upload/PreStockTab.tsx`**
- Substituir `SearchFilter` por `ProductSearchAutocomplete`
- Derivar lista de sugestões a partir dos `items` do pré-estoque (agrupar por produto, contar quantidade pendente)
- Passar `onValueChange={setSearch}` e `suggestions` derivados

### Resultado
- Busca na página de Compras terá autocomplete com logo de marca, highlight e sugestões dos produtos comprados
- Mesmo componente visual nas duas páginas
- Zero impacto na Tabela de Estoque (props opcionais, retrocompatível)


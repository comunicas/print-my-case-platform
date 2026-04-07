

## Restringir Busca de Produtos aos Nomes Exatos do Estoque

### Problema

O formulário de compra permite digitação livre — o usuário pode registrar um nome de produto que não existe no estoque (ex: "iPhone 17" em vez de "APPLE iPhone 17"). Isso quebra a dedução automática, pois o matching é por nome exato.

### Solução

Restringir a seleção apenas a produtos que existem em `stock_records`, removendo a opção de texto livre. O usuário só pode selecionar da lista — garantindo que o `product_name` salvo no `pre_stock` seja idêntico ao do estoque.

### Mudanças

**`src/components/upload/PreStockForm.tsx`**:

1. Remover o botão "Usar texto digitado" do `CommandEmpty` — substituir por mensagem "Nenhum produto encontrado"
2. Separar o estado de busca (`searchTerm`) do estado de seleção (`productName`) — o input do Command controla `searchTerm`, e `productName` só é preenchido ao selecionar um item da lista
3. Validação: o botão "Registrar" só habilita se `productName` estiver na lista de `productNames`
4. Ao selecionar um produto, mostrar o nome completo no trigger do Popover e limpar o `searchTerm` para a próxima busca

### Resultado

- Impossível registrar produto com nome diferente do estoque
- Dedução automática funciona com 100% de precisão no matching
- UX clara: busca fuzzy para encontrar, seleção obrigatória para confirmar


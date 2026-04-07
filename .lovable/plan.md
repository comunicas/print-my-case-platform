

## Mostrar Lista de Produtos ao Abrir o Popover

### Problema

Ao clicar em "Buscar produto...", a lista não aparece até digitar algo. O usuário quer ver todos os produtos imediatamente ao abrir, e ir filtrando conforme digita. Além disso, os produtos devem vir de todos os PDVs da organização (já funciona assim).

### Mudanças

**`src/components/upload/PreStockForm.tsx`**:

1. Quando `searchTerm` está vazio (`tokens.length === 0`), já retorna `productNames.slice(0, 30)` — isso está correto. O problema é que o `CommandEmpty` mostra "Digite o nome do produto" quando `searchTerm` está vazio, dando a impressão de que precisa digitar. Remover essa condição — sempre mostrar "Nenhum produto encontrado" apenas quando realmente não há resultados.

2. Aumentar o limite inicial de 30 para 50 produtos visíveis (são 90 no total, cabe bem).

3. Ajustar o `CommandEmpty` para só mostrar mensagem quando `filteredProducts.length === 0` de fato, removendo a distinção `searchTerm.trim() ? ... : "Digite o nome do produto"`.

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/components/upload/PreStockForm.tsx` | Remover mensagem "Digite o nome do produto", aumentar limite para 50, sempre mostrar lista ao abrir |

### Resultado

- Ao clicar no campo, todos os produtos aparecem imediatamente (até 50)
- Ao digitar, a lista filtra em tempo real por tokens
- UX fluida: abrir → ver lista → digitar para refinar


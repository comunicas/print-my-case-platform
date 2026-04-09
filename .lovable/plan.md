

## Correção do Refresh/Jitter na Busca do Autocomplete

### Problema Identificado

O `ProductSearchAutocomplete` tem um **loop de atualização circular** que causa jitter visual:

1. Usuário digita → `inputValue` muda → debounce de 300ms → `onChange(debouncedValue)` dispara
2. Parent (`PreStockTab`) atualiza `search` → re-renderiza → passa novo `value` prop
3. `useEffect([value])` sincroniza `inputValue` de volta → re-dispara o ciclo de debounce
4. Como `onChange` não é memoizado no parent, o efeito `[debouncedValue, onChange]` re-executa desnecessariamente

Além disso, na página de Compras, as `suggestions` são derivadas de `items` que dependem de `search` — quando search muda, items muda, suggestions muda, e o popover pisca.

### Solução

**1. `src/components/stock/ProductSearchAutocomplete.tsx`**
- Remover o efeito que sincroniza `onChange(debouncedValue)` — substituir por comparação explícita
- Usar `useRef` para guardar o último valor propagado e só chamar `onChange` quando realmente mudou
- No efeito de sync externo (`value` → `inputValue`), verificar se o valor realmente é diferente antes de atualizar, evitando re-trigger do debounce
- Usar `useCallback` ref para `onChange` para evitar dependência instável

**2. `src/components/upload/PreStockTab.tsx`**
- Memoizar o callback `setSearch` com `useCallback`
- Separar a derivação de `preStockSuggestions` para usar **todos os itens sem filtro de busca** (ou um snapshot fixo), evitando que as sugestões mudem enquanto o usuário digita

### Mudanças Técnicas

```text
ProductSearchAutocomplete.tsx:
├── useRef(lastPropagated) para evitar loop onChange → value → inputValue
├── useEffect([debouncedValue]) → só chama onChange se valor != lastPropagated
├── useEffect([value]) → só atualiza inputValue se value != inputValue (guard)
└── Remove onChange das deps do efeito de propagação

PreStockTab.tsx:
├── useCallback(setSearch) estável
└── preStockSuggestions derivadas de items sem filtro (snapshot completo)
```

### Resultado
- Zero jitter/refresh ao digitar
- Sugestões estáveis enquanto usuário digita
- Mesmo comportamento funcional (debounce + autocomplete + clear)


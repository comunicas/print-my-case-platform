

## Correções: Duplo Botão X e Refinamentos de Busca

### Problemas Identificados

1. **Duplo botão X no campo de busca**: O `ProductSearchAutocomplete` usa `type="search"` no input (linha 117), que renderiza um botão nativo do navegador para limpar. Somado ao botão X customizado (linhas 128-137), o resultado são dois botões sobrepostos — exatamente como na imagem enviada.

2. **Autocomplete não abre ao focar (foco rápido)**: Quando o campo perde e ganha foco rapidamente, o `onFocus` chama `setOpen(true)` mas o Popover pode fechar antes do estado propagar.

### Solução

**`src/components/stock/ProductSearchAutocomplete.tsx`**

- Trocar `type="search"` para `type="text"` — elimina o botão nativo do browser e mantém apenas o X customizado
- Adicionar CSS para esconder o botão nativo como fallback: `[&::-webkit-search-cancel-button]:hidden`

Mudança mínima — uma linha: linha 117, trocar `type="search"` por `type="text"`.

### Resultado
- Apenas um botão X visível (o customizado com ícone Lucide)
- Mesmo comportamento funcional
- Zero impacto em outros componentes


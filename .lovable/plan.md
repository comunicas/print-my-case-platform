

## Melhorar Busca de Produtos no Pré-Estoque

### Problema Atual

A busca no formulário de compra usa `string.includes()` simples — não consegue buscar por palavras separadas (ex: "redmi 14" não encontra "Redmi note14 Pro") e não tem destaque visual dos termos encontrados.

### Solução

Implementar busca fuzzy por tokens: cada palavra digitada é buscada independentemente no nome do produto. Digitar "redmi 14" encontra qualquer produto que contenha AMBAS as palavras. Números são tratados como tokens independentes.

### Mudanças

**`src/components/upload/PreStockForm.tsx`**:

1. Substituir filtro `.includes()` por busca multi-token:
   - Splittar input por espaços → array de tokens
   - Produto passa no filtro se TODOS os tokens aparecem no nome (case-insensitive)
   - Ex: "ip 15" → encontra "APPLE iPhone 15 Pro", "APPLE iPhone 15"
   
2. Adicionar destaque (highlight) dos termos encontrados nos resultados usando `<mark>`

3. Mostrar a marca extraída (via `extractBrandFromProductName`) como badge ao lado do nome para facilitar identificação visual

4. Usar `shouldFilter={false}` no Command (já que filtramos manualmente) para evitar dupla filtragem

5. Permitir digitação livre — se o produto não existe na lista, o usuário pode usar o texto digitado

### Resultado

- "redmi 14" → encontra todos Redmi com "14" no nome
- "iphone pro" → encontra iPhone Pro de qualquer geração
- "galaxy s24" → encontra Galaxy S24, S24+, S24 Ultra
- Busca instantânea, sem dependências extras


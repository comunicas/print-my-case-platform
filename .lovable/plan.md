

## Correção dos Logos de Marca no Autocomplete de Compras

### Problema
Na `PreStockTab.tsx`, as sugestões extraem a marca com `name.split(' ')[0]` (linha 196), que retorna texto bruto como `"Galaxy"` ou `"Redmi"`. O `BrandLogo` precisa de nomes canônicos (`"SAMSUNG"`, `"XIAOMI"`) que só o `extractBrandFromProductName` fornece.

### Solução
Substituir a lógica manual de split por `extractBrandFromProductName` e `extractModelFromProductName` de `@/lib/productNormalization`.

### Mudança

**`src/components/upload/PreStockTab.tsx`** (linhas 195-197):

Antes:
```typescript
const parts = name.split(' ');
const brand = parts[0] ?? '';
const model = parts.length > 1 ? parts.slice(1).join(' ') : name;
```

Depois:
```typescript
const brand = extractBrandFromProductName(name);
const model = extractModelFromProductName(name);
```

Adicionar import de `extractBrandFromProductName` e `extractModelFromProductName` de `@/lib/productNormalization`.

### Resultado
- Logos de Apple, Samsung, Xiaomi, Motorola aparecem corretamente nas sugestões
- Marcas via alias (Galaxy→Samsung, Redmi→Xiaomi) resolvidas automaticamente
- Zero impacto em outros componentes


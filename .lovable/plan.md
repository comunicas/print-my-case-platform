
# Mover ProductRequestsSettings e CatalogLeadsSettings para o modulo Marketing

## Mudancas

### 1. Mover arquivos
- `src/components/settings/ProductRequestsSettings.tsx` -> `src/components/marketing/ProductRequestsSettings.tsx`
- `src/components/settings/ProductRequestDetailModal.tsx` -> `src/components/marketing/ProductRequestDetailModal.tsx`
- `src/components/settings/CatalogLeadsSettings.tsx` -> `src/components/marketing/CatalogLeadsSettings.tsx`

### 2. Atualizar import interno
- Em `ProductRequestsSettings.tsx`, o import do `ProductRequestDetailModal` muda de `"./ProductRequestDetailModal"` (sem alteracao necessaria, pois ambos estarao no mesmo diretorio)

### 3. Atualizar `src/pages/Marketing.tsx`
- Lazy import de `CatalogLeadsSettings`: trocar path de `@/components/settings/CatalogLeadsSettings` para `@/components/marketing/CatalogLeadsSettings`
- Lazy import de `ProductRequestsSettings`: trocar path de `@/components/settings/ProductRequestsSettings` para `@/components/marketing/ProductRequestsSettings`

### 4. Atualizar barrel exports
- **Remover** de `src/components/settings/index.ts`: exports de `ProductRequestsSettings`, `ProductRequestDetailModal` e `CatalogLeadsSettings`
- **Adicionar** em `src/components/marketing/index.ts`: exports dos tres componentes

### Resumo
Sao 5 arquivos editados (2 barrel indexes + 1 pagina) e 3 arquivos movidos. Nenhum outro arquivo no projeto referencia esses componentes.

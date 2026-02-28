

# Mover PDVCatalogList para o modulo Marketing

## Objetivo

Reorganizar o componente `PDVCatalogList` de `src/components/settings/` para `src/components/marketing/`, refletindo que ele agora pertence exclusivamente ao modulo Marketing.

## Mudancas

1. **Criar** `src/components/marketing/PDVCatalogList.tsx` com o conteudo identico ao arquivo atual
2. **Remover** `src/components/settings/PDVCatalogList.tsx`
3. **Atualizar import** em `src/pages/Marketing.tsx`: trocar o path do lazy import de `@/components/settings/PDVCatalogList` para `@/components/marketing/PDVCatalogList`
4. **Atualizar** `src/components/marketing/index.ts`: adicionar export do `PDVCatalogList`

Nenhuma outra referencia ao componente existe no projeto, entao apenas o import na pagina Marketing precisa ser atualizado.


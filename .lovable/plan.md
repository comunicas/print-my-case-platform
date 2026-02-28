
# Mostrar nome da organizacao nos cards de catalogo

## Mudancas

### 1. Hook `usePDVCatalogSettings.ts`
- Adicionar `organization_id` ao SELECT dos PDVs: `select("id, name, location, organization_id")`
- Buscar os nomes das organizacoes em paralelo (um SELECT distinto na tabela `organizations` com os IDs unicos)
- Incluir `organization_name` no tipo `PDVWithCatalogSettings`

### 2. Componente `PDVCatalogList.tsx`
- Receber `showOrgName` como prop (ou derivar internamente: mostrar quando `organizationId` for undefined)
- Passar `organization_name` para `PDVCatalogRow`
- No card, exibir o nome da org como um Badge ou texto secundario abaixo do location, apenas quando `showOrgName` for true

## Detalhes Tecnicos

No hook, a query de organizacoes sera:
```typescript
const orgIds = [...new Set(pdvs.map(p => p.organization_id))];
const { data: orgs } = await supabase
  .from("organizations")
  .select("id, name")
  .in("id", orgIds);
```

No card, renderizar condicionalmente:
```
PDV Name
Location | Org Name (badge secondary)
```

A logica de exibicao: quando `organizationId` prop for undefined (modo "todas"), mostrar o nome da org. Quando for um ID especifico, omitir pois todos sao da mesma org.

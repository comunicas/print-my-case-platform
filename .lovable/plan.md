
# Corrigir Conflitos de Filtros no Marketing

## Problema Raiz

A pagina Marketing usa `useOrganization()` que **sempre** busca `profile.organization_id` (a org propria do usuario), ignorando completamente o OrgSwitcher. Isso causa:

1. **Catalogos**: `PDVCatalogList` recebe `organization.id` fixo, mostrando apenas PDVs da org propria mesmo com "Todas as organizacoes" selecionado
2. **Cupons**: Mesmo problema -- `CouponsSettings` recebe `organizationId={organization.id}` fixo
3. **Midias**: Idem -- `MediaSettings` recebe `organizationId={organization.id}`
4. **Leads**: `useCatalogLeads` nao filtra por org/PDV -- depende apenas do RLS
5. **Guard quebrado**: `if (!organization) return "Organizacao nao encontrada"` bloqueia a pagina quando o contexto nao e a org propria

## Solucao

### 1. Marketing.tsx -- Integrar com ActiveOrgContext

Substituir `useOrganization()` por `useActiveOrg()` como fonte de contexto organizacional:

- Importar `useActiveOrg` do contexto
- Usar `activeOrgId` para passar aos componentes filhos
- Remover o guard `if (!organization)` que bloqueia quando "all" esta selecionado
- Para super_admin com "all", os componentes recebem `undefined` como orgId e buscam tudo

### 2. usePDVCatalogSettings -- Suportar modo "all"

Atualmente recebe `organizationId` e faz `.eq("organization_id", organizationId)`. Precisa:

- Quando `organizationId` for `undefined` ou `"all"`, buscar todos os PDVs ativos (sem filtro de org)
- Manter o filtro `.eq()` quando for um ID especifico

### 3. PDVCatalogList -- Aceitar orgId opcional

- Tornar `organizationId` opcional na interface
- Passar o valor correto do contexto ativo

### 4. CouponsSettings -- Aceitar orgId opcional

- Mesmo ajuste: quando `organizationId` for undefined, o hook ja buscara todos

### 5. Remover guard de organizacao obrigatoria

O `if (!organization)` impede renderizar quando "Todas as organizacoes" esta selecionado. Substituir por verificacao do `activeOrgId` -- se existe contexto ativo (mesmo "all"), renderizar normalmente.

---

## Detalhes Tecnicos

### Arquivo: `src/pages/Marketing.tsx`
- Trocar `useOrganization({ readOnly: true })` por `useActiveOrg()`
- Derivar `effectiveOrgId` de `activeOrgId` (quando "all", passar undefined para hooks)
- Remover guard `if (!organization)` 
- Passar `effectiveOrgId` para `CouponsSettings`, `MediaSettings`, `PDVCatalogList`
- Manter `useProfile()` para `isAdmin`/`isSuperAdmin`

### Arquivo: `src/hooks/usePDVCatalogSettings.ts`
- Tornar `organizationId` opcional
- Quando undefined: buscar todos os PDVs ativos sem filtro de org (RLS garante isolamento)
- Quando string: manter `.eq("organization_id", organizationId)`

### Arquivo: `src/components/settings/PDVCatalogList.tsx`
- Tornar `organizationId` opcional na interface

### Arquivo: `src/components/marketing/CouponsSettings.tsx`
- Tornar `organizationId` opcional na interface
- Propagar para `usePDVCatalogSettings`

### Arquivo: `src/components/marketing/MediaSettings.tsx`
- Tornar `organizationId` opcional na interface

### Memoria de rotas
- Atualizar `routing-tab-naming-convention` para incluir `catalogos` na lista de tabs do Marketing

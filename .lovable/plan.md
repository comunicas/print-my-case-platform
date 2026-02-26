

# Revisao Critica do Plano de Isolamento Multi-Org

## Veredicto: O plano esta 90% completo, mas tem 3 lacunas

O nucleo do plano (limpeza SQL + correcao da funcao + trigger + filtro no usePDVs) e correto e resolve a raiz do problema. Porem, encontrei pontos que precisam de ajuste:

---

## Lacuna 1: `usePDVs` com `useActiveOrg` pode quebrar em contextos especificos

O plano propoe adicionar `useActiveOrg()` dentro de `usePDVs`. Isso funciona para a maioria dos consumidores (todos estao dentro de `ActiveOrgProvider` no App.tsx). Porem:

- `Settings.tsx` chama `usePDVs()` sem `organizationId` para popular o dropdown de PDV padrao nas preferencias. Com o filtro de `activeOrgId`, isso passa a funcionar corretamente (mostra apenas PDVs da org ativa).
- `UserPDVsDialog` ja passa `organizationId` explicitamente, entao nao e afetado.

**Nenhum problema real aqui** - mas o plano deve garantir que quando `activeOrgId` for `null` (carregamento inicial), a query use `profile?.organization_id` como fallback, exatamente como proposto.

## Lacuna 2: Flash do botao "Novo Upload" (bug identificado no teste anterior)

O plano NAO inclui a correcao do flash do botao "Novo Upload" que foi detectado durante o teste com o viewer. A condicao `role !== 'viewer'` avalia como `true` quando `role` e `undefined` (durante carregamento do profile).

**Correcao necessaria**:
```typescript
const canUpload = !!role && role !== "viewer";
```

## Lacuna 3: `useProductAnalytics` faz query de `sales_records` sem filtro de org

O hook `useProductAnalytics` busca vendas com `.ilike('product_name', ...)` sem filtrar por organizacao. Depende APENAS do RLS via `user_can_access_pdv`. Embora a correcao da funcao SQL resolva o leak no banco, o hook tambem deveria filtrar por PDVs da org ativa para evitar trazer dados de orgs com `user_org_access` quando o contexto e da org propria.

**Impacto**: Se um usuario tem acesso cross-org (via `user_org_access`), ao clicar em um produto no estoque, as analytics podem incluir vendas daquele produto em TODAS as orgs acessiveis, nao apenas na org ativa.

---

## Plano Revisado Completo

### Fase 1: Migration SQL (sem alteracao ao plano original)

1. Limpar `user_pdvs` cross-org (DELETE dos 2 registros corrompidos)
2. Corrigir `user_can_access_pdv` adicionando `AND p.organization_id = get_user_org_id(_user_id)` na branch de `user_pdvs`
3. Criar trigger `trg_validate_user_pdv` para prevenir futuras atribuicoes cross-org

### Fase 2: Correcoes no frontend

1. **`src/hooks/usePDVs.ts`**: Adicionar `useActiveOrg()` e usar `activeOrgId` como fallback para filtrar por organizacao
2. **`src/pages/Uploads.tsx`**: Corrigir flash do botao — `const canUpload = !!role && role !== "viewer"`
3. **`src/hooks/useProductAnalytics.ts`**: Filtrar vendas pelos PDVs da org ativa (usando `activeOrgId` para buscar PDV IDs e filtrar com `.in('pdv_id', pdvIds)`)

### Fase 3: Validacao

Testar como operator/viewer para confirmar:
- Dropdown de PDVs mostra apenas PDVs da org ativa
- Dashboard nao mostra dados de outras orgs
- Analytics de produto nao vaza dados cross-org
- Botao de upload nao faz flash durante carregamento

---

## Resumo de Arquivos Alterados

| Arquivo | Alteracao |
|---|---|
| Migration SQL | Limpar dados + corrigir funcao + trigger |
| `src/hooks/usePDVs.ts` | Filtrar por `activeOrgId` |
| `src/pages/Uploads.tsx` | Fix flash: `!!role && role !== "viewer"` |
| `src/hooks/useProductAnalytics.ts` | Filtrar por PDVs da org ativa |


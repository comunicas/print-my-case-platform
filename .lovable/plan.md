
# Corrigir Acesso Multi-Org para Super Admins

## Problema

O super_admin nao consegue ver os dados do Boulevard Tatuape no Financeiro porque o **OrgSwitcher nao aparece** no header. O hook `useUserOrganizations` busca apenas:
1. A organizacao propria do usuario (via `profiles.organization_id`)
2. Acessos explicitos na tabela `user_org_access`

Como o super_admin nao tem registro em `user_org_access` para a org HB Solucoes Digitais, `hasMultipleOrgs` retorna `false` e o switcher fica oculto.

## Solucao

Alterar o hook `useUserOrganizations` (`src/hooks/useUserOrganizations.ts`) para que super_admins vejam **todas as organizacoes** do sistema.

### Alteracao no hook

Adicionar um passo intermediario entre buscar a org propria e buscar os grants:

```text
// Se super_admin, buscar TODAS as organizacoes
if (isSuperAdmin) {
  const { data: allOrgs } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");
  
  return (allOrgs ?? []).map(org => ({
    id: org.id,
    name: org.name,
    accessLevel: org.id === profile.organization_id ? "owner" : "editor",
  }));
}
```

### Dependencia

O hook precisa saber se o usuario e super_admin. O `useProfile` ja expoe `isSuperAdmin`, entao basta importar e usar.

### Arquivos a alterar

1. **`src/hooks/useUserOrganizations.ts`** - Adicionar busca de todas as orgs quando `isSuperAdmin` for true. Usar `useProfile().isSuperAdmin` para a verificacao.

### Impacto

- O OrgSwitcher passara a aparecer no header para super_admins
- Ao trocar para HB Solucoes Digitais, o Financeiro mostrara os dados do Boulevard Tatuape
- Nenhuma alteracao de banco necessaria
- Nenhum impacto em usuarios que nao sao super_admin

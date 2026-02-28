

# Corrigir RLS de catalog_short_links para Super Admins

## Problema

A politica RLS atual da tabela `catalog_short_links` usa apenas `get_user_org_id(auth.uid())` para verificar se o PDV pertence a organizacao do usuario. Super admins nao conseguem criar/gerenciar short links para PDVs de outras organizacoes porque a politica nao inclui o bypass `is_super_admin()`.

Politica atual:
```text
USING:  is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
CHECK:  is_admin(auth.uid()) AND pdv_id IN (SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid()))
```

## Tabelas Afetadas

O mesmo padrao existe em outras tabelas do modulo Marketing que tambem precisam do bypass:

1. **catalog_short_links** -- gerenciamento de links curtos
2. **pdv_catalog_settings** -- configuracoes de catalogo por PDV  
3. **pdv_marketing_media** -- midias de marketing por PDV
4. **link_click_events** -- visualizacao de eventos de clique

## Solucao

Atualizar as politicas RLS dessas 4 tabelas para incluir `OR is_super_admin(auth.uid())` como bypass, seguindo o padrao ja usado em `pdvs`, `uploads` e outras tabelas do sistema.

## Detalhes Tecnicos

Uma unica migracao SQL que:

1. Remove as politicas atuais (DROP POLICY)
2. Recria com a logica corrigida:

```text
catalog_short_links (ALL):
  USING/CHECK: (is_admin(...) AND pdv_id IN org_pdvs) OR is_super_admin(...)

pdv_catalog_settings (ALL para admins):
  USING/CHECK: (is_admin(...) AND pdv_id IN org_pdvs) OR is_super_admin(...)

pdv_marketing_media (ALL para admins):
  USING/CHECK: (is_admin(...) AND pdv_id IN org_pdvs) OR is_super_admin(...)

link_click_events (SELECT):
  USING: (is_admin(...) AND short_link_id IN org_links) OR is_super_admin(...)
```

A politica SELECT publica (`user_can_access_pdv`) em `pdv_catalog_settings` e `pdv_marketing_media` permanece inalterada pois ja funciona corretamente via a funcao que inclui bypass de super_admin.


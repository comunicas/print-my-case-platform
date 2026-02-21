
# Acesso Multi-Org Granular - Implementado

## O que foi feito

### Backend (Migração SQL)
1. Criada tabela `user_org_access` com campos `user_id`, `organization_id`, `access_level` (viewer/editor)
2. Criada função `user_has_org_access()` (SECURITY DEFINER) para checar acesso cross-org
3. Atualizada função `user_can_access_pdv()` para incluir acesso cross-org
4. Atualizadas políticas RLS SELECT em: `pdvs`, `stock_history`, `organizations`, `notifications`, `products`
5. Inserido acesso viewer para `feahorita@gmail.com` na organização **RB Digital Tech**

### Frontend
1. `src/hooks/useUserOrganizations.ts` - Hook que busca orgs acessíveis (própria + cross-org)
2. `src/contexts/ActiveOrgContext.tsx` - Contexto global com org ativa selecionada
3. `src/components/layout/OrgSwitcher.tsx` - Dropdown de seleção de empresa no header
4. Atualizado `AppHeader.tsx` para mostrar OrgSwitcher quando há múltiplas orgs
5. Atualizado `App.tsx` com ActiveOrgProvider
6. Atualizado `Index.tsx` para usar activeOrgId nos filtros de dashboard
7. Atualizado `usePDVs.ts` para aceitar orgId de qualquer organização acessível

## Comportamento
- Usuários com acesso a múltiplas orgs veem um dropdown no header
- Ao trocar de org, dashboard e filtros de PDV são atualizados
- Badge "Somente leitura" aparece para orgs com acesso viewer
- Seleção persiste no localStorage

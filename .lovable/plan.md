

# Criar API Key para HB Soluções Digitais

## Problema

O super_admin nao consegue criar API Keys para organizacoes que nao sao a sua propria. Dois bloqueios:

1. **RLS**: As policies de `api_keys` exigem `organization_id = get_user_org_id(auth.uid())` — sem bypass para super_admin
2. **Hook**: `useApiKeys` usa `useOrganization({ readOnly: true })` que sempre retorna a org do proprio usuario, ignorando a org ativa no `OrgSwitcher`

## Solucao

### 1. Migracoes SQL — Adicionar bypass super_admin nas policies de api_keys

Atualizar as 4 policies (SELECT, INSERT, UPDATE, DELETE) para incluir `OR is_super_admin(auth.uid())`:

```sql
-- SELECT
DROP POLICY "Admins can view api keys" ON api_keys;
CREATE POLICY "Admins can view api keys" ON api_keys FOR SELECT
  USING (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- INSERT
DROP POLICY "Admins can create api keys" ON api_keys;
CREATE POLICY "Admins can create api keys" ON api_keys FOR INSERT
  WITH CHECK (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- UPDATE
DROP POLICY "Admins can update api keys" ON api_keys;
CREATE POLICY "Admins can update api keys" ON api_keys FOR UPDATE
  USING (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );

-- DELETE
DROP POLICY "Admins can delete api keys" ON api_keys;
CREATE POLICY "Admins can delete api keys" ON api_keys FOR DELETE
  USING (
    (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
    OR is_super_admin(auth.uid())
  );
```

### 2. `src/hooks/useApiKeys.ts` — Usar org ativa do contexto

Substituir `useOrganization({ readOnly: true })` por `useActiveOrg()`. Quando `activeOrgId` for uma org especifica, usar esse ID para queries e insercoes. Quando for `"all"`, desabilitar a criacao (nao faz sentido criar key para "todas").

Mudancas:
- Importar `useActiveOrg` em vez de `useOrganization`
- Usar `activeOrgId` para filtrar e inserir
- Desabilitar query quando `activeOrgId === "all"`

### 3. `src/components/settings/IntegrationsSettings.tsx` — Tratar estado "all"

Quando `activeOrgId === "all"`, exibir mensagem orientando o super_admin a selecionar uma organizacao especifica no OrgSwitcher antes de criar API Keys.

## Fluxo apos implementacao

1. Super admin seleciona "HB Soluções Digitais" no OrgSwitcher
2. Vai em Configuracoes > Integracoes
3. Clica "Nova Key", da um nome (ex: "n8n-hb-boulevard")
4. Copia a chave gerada
5. Configura no sistema externo (n8n/cron) com o header `Authorization: Bearer <key>`
6. Dados do BOULEVARD TATUAPE passam a ser ingeridos via API

## Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Atualizar 4 RLS policies de api_keys com bypass super_admin |
| `src/hooks/useApiKeys.ts` | Usar `useActiveOrg()` em vez de `useOrganization` |
| `src/components/settings/IntegrationsSettings.tsx` | Mensagem quando org = "all" |


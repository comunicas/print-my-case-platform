
# Fase 5 do Code Review: Correção dos 5 Gaps de Segurança nas Políticas RLS

## Contexto e Análise

Após auditoria completa das políticas RLS de todas as 22 tabelas públicas do banco, foram identificados 5 gaps de segurança com diferentes níveis de severidade. Este plano propõe correções cirúrgicas via uma única migração SQL.

## Análise Detalhada de Cada Gap

### Gap 1 — CRÍTICO: Bug no Rate Limit de `catalog_leads`

**Tabela:** `catalog_leads`
**Política:** `Anyone can insert catalog leads with rate limit`
**Problema:** A expressão `WITH CHECK` contém `cl.phone = cl.phone`, que é uma auto-comparação e sempre retorna `true` (qualquer valor é igual a si mesmo). A intenção era comparar com o telefone do novo registro sendo inserido (`catalog_leads.phone`), mas o alias `cl` foi usado nos dois lados.

```sql
-- BUGGY (sempre true):
NOT (EXISTS (SELECT 1 FROM catalog_leads cl
  WHERE (cl.phone = cl.phone)           -- ← bug: cl.phone = cl.phone
    AND (cl.organization_id = catalog_leads.organization_id)
    AND (cl.created_at > (now() - interval '1 minute'))
))

-- CORRETO:
NOT (EXISTS (SELECT 1 FROM catalog_leads cl
  WHERE (cl.phone = catalog_leads.phone)  -- ← compara com o novo registro
    AND (cl.organization_id = catalog_leads.organization_id)
    AND (cl.created_at > (now() - interval '1 minute'))
))
```

**Impacto:** O rate limit de 1 inserção por minuto por telefone/organização está completamente inativo. Qualquer pessoa pode inserir leads ilimitados via catálogo público, podendo poluir a tabela com spam massivo.

**Correção:** DROP da política atual e CREATE com a expressão corrigida.

---

### Gap 2 — ALTO: `audit_logs` INSERT aberto com `WITH CHECK: true`

**Tabela:** `audit_logs`
**Política:** `Authenticated users can insert audit logs`
**Problema:** `WITH CHECK: true` permite que qualquer usuário autenticado insira qualquer dado na tabela, incluindo:
- Falsificar `actor_id` de outro usuário
- Forjar entradas com `organization_id` de outra organização
- Criar entradas falsas de `event_type` como `permission_violation` para incriminar outros usuários

**Contexto importante:** Confirmado na análise das Edge Functions que **todas** as inserções reais em `audit_logs` ocorrem via `supabaseAdmin` (client com `SUPABASE_SERVICE_ROLE_KEY`), que bypassa RLS completamente. A política de INSERT para usuários autenticados via anon key, portanto, nunca é necessária para o funcionamento normal do sistema — ela é apenas uma superfície de ataque.

**Correção:** Substituir `WITH CHECK: true` por `WITH CHECK: (actor_id = auth.uid())`, garantindo que usuários autenticados só possam inserir logs onde são o próprio ator. Isso não afeta as Edge Functions (que usam service_role e ignoram RLS).

---

### Gap 3 — ALTO: `organizations` UPDATE sem `WITH CHECK`

**Tabela:** `organizations`
**Política:** `Org admins can update their organization`
**Problema:** A política tem apenas `USING: ((id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))` sem `WITH CHECK`. No PostgreSQL, para UPDATE, `USING` controla quais linhas podem ser selecionadas para atualização, mas `WITH CHECK` valida o estado da linha **após** a atualização. Sem `WITH CHECK`, um org_admin poderia:
- Alterar o `id` da organização (se a coluna não for PK imutável)
- Mais relevante: não há validação explícita de que a linha resultante ainda pertence à mesma organização

**Correção:** Adicionar `WITH CHECK: ((id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))` — mesma expressão do USING, garantindo que a linha resultante da UPDATE também satisfaça a condição de pertencimento.

---

### Gap 4 — MÉDIO: `notifications` UPDATE sem `WITH CHECK`

**Tabela:** `notifications`
**Política:** `Users can update their notifications`
**Problema:** A política tem `USING: ((organization_id = get_user_org_id(auth.uid())) AND ((user_id IS NULL) OR (user_id = auth.uid())))` sem `WITH CHECK`. Sem essa proteção, um usuário autenticado com acesso a uma notificação pode modificar campos não intencionais como `title`, `message`, `type`, `metadata` ou até `organization_id`, além de apenas marcar como lida (`is_read`). A intenção declarada no hook `useNotifications.ts` é apenas marcar notificações como lidas.

**Correção:** Adicionar `WITH CHECK` com a mesma expressão do USING, garantindo que a linha resultante ainda pertença à mesma organização e ao mesmo usuário.

---

### Gap 5 — BAIXO: `products` ALL sem `WITH CHECK` explícito

**Tabela:** `products`
**Política:** `Admins can manage products`
**Análise:** Esta é a menos crítica dos 5. No PostgreSQL, quando uma política `ALL` é criada com apenas `USING` e sem `WITH CHECK`, o banco de dados **automaticamente usa a expressão USING como WITH CHECK** para operações de INSERT e UPDATE. Portanto, tecnicamente o comportamento atual já é seguro.

**Por que corrigir mesmo assim:** A ausência de `WITH CHECK` explícito é um risco de manutenção — qualquer desenvolvedor que leia a política no futuro pode incorretamente assumir que não há validação para INSERT/UPDATE, ou uma futura versão do Postgres poderia mudar o comportamento padrão. Explicitar é uma boa prática de segurança defensiva.

**Correção:** Recriar a política com `WITH CHECK` explícito idêntico ao `USING`.

---

## Impacto em Código Frontend/Edge Functions

| Tabela | Edge Functions afetadas | Frontend afetado |
|---|---|---|
| `catalog_leads` | `send-otp`, `verify-otp` (usam service_role, não afetados) | `PublicStockList.tsx` — inserção anônima via anon key pode ser afetada |
| `audit_logs` | Nenhuma (usam service_role) | Nenhum (não há insert direto de audit_logs no frontend) |
| `organizations` | Nenhuma | `OrganizationSettings.tsx` — UPDATE normal, não afetado |
| `notifications` | Nenhuma | `useNotifications.ts` — apenas marca `is_read`, não afetado |
| `products` | Nenhuma | Funcionalidade de produtos, não afetada |

**Importante para `catalog_leads`:** A correção do rate limit pode bloquear inserções que atualmente passam sem restrição. O fluxo real de inserção passa pela Edge Function `verify-otp` com service_role — portanto não é afetado. O único caso afetado seria uma inserção direta via anon key (que não deveria existir no fluxo atual).

---

## Arquivo de Migração SQL

Uma única migração com 5 blocos, um por tabela:

```sql
-- ============================================================
-- Fase 5: Correção de 5 gaps de segurança nas políticas RLS
-- ============================================================

-- Gap 1: Corrigir bug cl.phone = cl.phone em catalog_leads
DROP POLICY IF EXISTS "Anyone can insert catalog leads with rate limit" ON public.catalog_leads;
CREATE POLICY "Anyone can insert catalog leads with rate limit"
  ON public.catalog_leads
  FOR INSERT
  WITH CHECK (
    NOT (EXISTS (
      SELECT 1
      FROM catalog_leads cl
      WHERE cl.phone = catalog_leads.phone    -- ← corrigido: era cl.phone = cl.phone
        AND cl.organization_id = catalog_leads.organization_id
        AND cl.created_at > (now() - interval '1 minute')
    ))
  );

-- Gap 2: Restringir audit_logs INSERT para apenas o próprio ator
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Gap 3: Adicionar WITH CHECK em organizations UPDATE
DROP POLICY IF EXISTS "Org admins can update their organization" ON public.organizations;
CREATE POLICY "Org admins can update their organization"
  ON public.organizations
  FOR UPDATE
  USING ((id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
  WITH CHECK ((id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));

-- Gap 4: Adicionar WITH CHECK em notifications UPDATE
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    (organization_id = get_user_org_id(auth.uid()))
    AND ((user_id IS NULL) OR (user_id = auth.uid()))
  )
  WITH CHECK (
    (organization_id = get_user_org_id(auth.uid()))
    AND ((user_id IS NULL) OR (user_id = auth.uid()))
  );

-- Gap 5: Tornar WITH CHECK explícito em products ALL
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  USING ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
  WITH CHECK ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()));
```

---

## Resumo dos Arquivos Alterados

| Arquivo | Tipo de mudança |
|---|---|
| `supabase/migrations/<timestamp>_security_rls_fixes.sql` | CRIAR — migração com as 5 correções |

Nenhum arquivo de frontend ou Edge Function precisa ser modificado. As correções são puramente no banco de dados.

---

## Verificação Pós-Migração

Após aplicar a migração, os pontos a verificar são:

1. **catalog_leads:** Tentar inserir 2 leads com o mesmo telefone em menos de 1 minuto — o segundo deve ser rejeitado com erro de política RLS
2. **audit_logs:** Um usuário autenticado com `actor_id` diferente do seu `auth.uid()` deve ter o INSERT rejeitado
3. **organizations:** UPDATE normal de nome/email por org_admin deve continuar funcionando
4. **notifications:** Marcar como lida (`is_read: true`) deve continuar funcionando; tentativa de alterar `organization_id` deve ser rejeitada
5. **products:** CRUD normal de produtos por admins deve continuar funcionando sem alteração

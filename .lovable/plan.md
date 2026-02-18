
# Audit Completo das Edge Functions — Fase 6 do Code Review

## Metodologia

Foram analisadas 7 Edge Functions completas (`create-user`, `process-spreadsheet`, `update-password`, `reprocess-refunds`, `ingest-revenue`, `ingest-stock`, `send-otp`, `verify-otp`) em 4 eixos: validação de JWT, sanitização de inputs, rate limiting por IP, e privilege escalation.

---

## Resumo Executivo

```text
┌─────────────────────────┬──────────────┬──────────────┬───────────────┬────────────────────┐
│ Edge Function           │ Auth JWT     │ Sanitização  │ Rate Limit IP │ Privilege Escalation│
├─────────────────────────┼──────────────┼──────────────┼───────────────┼────────────────────┤
│ create-user             │ APROVADO     │ APROVADO     │ AUSENTE 🟡   │ APROVADO            │
│ process-spreadsheet     │ APROVADO     │ APROVADO     │ AUSENTE 🟡   │ APROVADO            │
│ update-password         │ APROVADO     │ APROVADO     │ AUSENTE 🟡   │ APROVADO            │
│ reprocess-refunds       │ APROVADO     │ APROVADO     │ AUSENTE 🟡   │ APROVADO            │
│ ingest-revenue          │ API KEY ✅   │ APROVADO     │ AUSENTE 🟡   │ APROVADO            │
│ ingest-stock            │ API KEY ✅   │ APROVADO     │ AUSENTE 🟡   │ APROVADO            │
│ send-otp                │ PÚBLICO ✅   │ APROVADO     │ DB-ONLY 🟡   │ N/A                 │
│ verify-otp              │ PÚBLICO ✅   │ APROVADO     │ AUSENTE 🔴   │ N/A                 │
└─────────────────────────┴──────────────┴──────────────┴───────────────┴────────────────────┘
```

---

## Análise Detalhada por Eixo

### 1. Validação de JWT

**Estratégia atual — correta e bem implementada:**

- `create-user`, `process-spreadsheet`, `update-password`: `verify_jwt = true` no `config.toml`. Além disso, fazem dupla verificação chamando `supabaseUser.auth.getUser()` para validar o token com o servidor. **APROVADO.**
- `reprocess-refunds`: `verify_jwt = false`, porém verifica o JWT manualmente via `getClaims()` + checa se o usuário é `super_admin` na tabela `user_roles`. **APROVADO — padrão correto para funções que precisam de lógica customizada.**
- `ingest-revenue`, `ingest-stock`: `verify_jwt = false`, sem JWT — usam API Key com hash SHA-256. **APROVADO — o design intencional está documentado em memória.**
- `send-otp`, `verify-otp`: `verify_jwt = false`, sem JWT nem API Key — endpoints públicos para o fluxo de catálogo. **APROVADO — público por design.**

**Conclusão JWT:** Nenhum problema crítico. O design de cada função é consistente com seu caso de uso.

---

### 2. Sanitização de Inputs

**Análise por função:**

**`create-user`:**
- `name`, `email`, `password` são validados como presentes, mas **não há sanitização de comprimento máximo** em `name`, `email`, ou `organizationName`.
- `role` é validado contra uma allowlist (`validRoles`). **Correto.**
- `organizationId` é passado diretamente para uma query como `.eq('id', organizationId)` — como o parâmetro não é tratado como SQL raw, isso é seguro via ORM, mas idealmente deveria validar o formato UUID antes de usar.
- Não há limite de tamanho no body JSON — um atacante poderia enviar um `name` de 100 MB.

**Gap identificado — BAIXO:**
```typescript
// Atual: sem validação de tamanho
let { name, email, password, ... } = await req.json();

// Ideal:
name = String(name ?? '').substring(0, 255).trim();
email = String(email ?? '').substring(0, 255).trim();
organizationName = String(organizationName ?? '').substring(0, 255).trim();
// + validate email format server-side
// + validate organizationId is UUID format
```

**`process-spreadsheet`:**
- Excelente sanitização: `sanitizeString()`, `sanitizeDeviceId()`, `sanitizeOrderNumber()` com limites de campo, remoção de caracteres de controle, e `substring(0, maxLength)`. 
- Limite de 50.000 linhas para prevenir DoS. **APROVADO.**

**`update-password`:**
- `newPassword` tem validação robusta de força (8+ chars, maiúsculas, minúsculas, números, especiais) server-side.
- Sem sanitização de comprimento máximo para `newPassword` — uma senha de 1 MB seria aceita até a validação de força.

**Gap — MUITO BAIXO:** Adicionar `if (newPassword.length > 1024) return error` antes da validação de força.

**`reprocess-refunds`:**
- Não recebe inputs do usuário além do token JWT. Sem parâmetros no body. **APROVADO.**

**`ingest-revenue`:**
- Todos os campos textuais passam por `sanitizeString()` com limites.
- `amount`, `refund_amount`, `discount_amount`, `actual_paid_amount` passam por `parseAmount()` com clamping entre 0 e 10M.
- `device_id` passa por `sanitizeDeviceId()` (apenas alphanum + hífens).
- `order_number` passa por `sanitizeOrderNumber()` (apenas alphanum + `-_.`).
- **APROVADO.**

**`ingest-stock`:**
- Mesma qualidade que `ingest-revenue`. Todos os campos têm limites e sanitização.
- **APROVADO.**

**`send-otp`:**
- `phone` validado com regex `/^\d{10,11}$/`. Aceita exatamente 10 ou 11 dígitos. **Correto.**
- **APROVADO.**

**`verify-otp`:**
- `phone` validado com `/^\d{10,11}$/`. **Correto.**
- `code` validado com `/^\d{6}$/`. **Correto.**
- **APROVADO.**

---

### 3. Rate Limiting por IP

**Este é o principal gap do audit.** Nenhuma função implementa rate limiting baseado em IP — apenas `send-otp` tem rate limiting baseado em número de telefone (no banco de dados, máx 3 OTPs por 10 minutos), mas mesmo essa proteção não usa IP.

**Mapeamento de risco por função:**

| Função | Risco sem rate limit por IP | Severidade |
|---|---|---|
| `verify-otp` | Força bruta no código de 6 dígitos (1.000.000 combinações). Com 3 req/s: ~4 dias para quebrar. Com 1000 req/s: ~17 minutos. | **ALTA** |
| `send-otp` | Rate limit por telefone existe (DB), mas um atacante com múltiplos telefones pode fazer flood da Twilio, gerando custos. | **MÉDIA** |
| `create-user` | Um org_admin poderia criar muitos usuários rapidamente. | **BAIXA** |
| `ingest-revenue`, `ingest-stock` | Protegidos por API Key; múltiplos IPs precisariam da mesma chave. | **MUITO BAIXA** |
| `process-spreadsheet`, `update-password`, `reprocess-refunds` | Exigem JWT válido. | **MUITO BAIXA** |

**Gap Crítico: `verify-otp` sem proteção contra brute-force:**

O código OTP é de 6 dígitos (1.000.000 combinações). A função não limita tentativas por IP nem por número de telefone. Um atacante poderia:
1. Interceptar que um telefone recebeu um OTP (via `send-otp`)
2. Fazer chamadas paralelas a `verify-otp` até adivinhar o código dentro dos 5 minutos de validade

**Correção necessária:** Adicionar à tabela `otp_verifications` uma coluna `attempt_count` e rejeitar após 5 tentativas falhas para o mesmo telefone. Isso é mais robusto que rate limit por IP (que pode ser contornado com proxies).

---

### 4. Privilege Escalation

**Análise de `create-user` — função mais sensível:**

A função implementa uma hierarquia de permissões bem construída:
- `org_admin` não pode criar `org_admin` ou `super_admin` (linhas 359-382).
- `org_admin` não pode criar usuários em outra organização — o `organizationId` recebido no body é **ignorado** e substituído pelo `callerOrgId` obtido do banco (linha 355). **Excelente proteção.**
- `org_admin` não pode criar nova organização (linha 290-311).
- Apenas `super_admin` pode criar `super_admin` (linha 386-405).

**Único risco teórico restante — MUITO BAIXO:**
O `createNewOrganization` e `organizationId` são lidos do body JSON *antes* das verificações de permissão, e o audit log no `user_creation_attempt` inclui `requested_organization_id: organizationId`. Se um `org_admin` tentasse injetar um UUID de outra organização, ele seria **loggado mas não usado** (linha 355 força o `callerOrgId`). Comportamento correto.

**Análise de `reprocess-refunds`:**
- Verifica `role === 'super_admin'` no banco via `user_roles`. Um `org_admin` não pode acessar.
- **APROVADO.**

**Análise de `ingest-revenue` e `ingest-stock`:**
- A `organization_id` **não vem do body da requisição** — é sempre derivada da `api_key` consultada no banco. Um atacante não pode enviar `organization_id` diferente para acessar dados de outra org.
- O `device_id` também é validado: deve pertencer a um PDV da mesma organização da API Key.
- **APROVADO — arquitetura de privilege escalation sólida.**

---

## Problemas Identificados para Correção

### Problema 1 — ALTO: `verify-otp` vulnerável a brute-force

**Arquivo:** `supabase/functions/verify-otp/index.ts`

Sem limite de tentativas, um atacante pode tentar sistematicamente todos os 1.000.000 de combinações de 6 dígitos dentro dos 5 minutos de validade do OTP.

**Solução:** Adicionar coluna `attempt_count` à tabela `otp_verifications` e rejeitar após 5 tentativas para o mesmo `phone`. Adicionar lógica na Edge Function para incrementar e verificar antes de comparar o código.

```sql
-- Migração necessária:
ALTER TABLE public.otp_verifications ADD COLUMN attempt_count integer NOT NULL DEFAULT 0;
```

```typescript
// verify-otp/index.ts — lógica a adicionar:
// 1. Buscar OTP válido pelo phone apenas (sem checar code ainda)
// 2. Se attempt_count >= 5, rejeitar com "Muitas tentativas"
// 3. Incrementar attempt_count
// 4. ENTÃO comparar o code
// 5. Se incorreto, retornar erro (attempt_count já foi incrementado)
// 6. Se correto, marcar verified = true
```

### Problema 2 — BAIXO: `create-user` sem validação de comprimento/formato de inputs de texto

**Arquivo:** `supabase/functions/create-user/index.ts`

`name`, `email`, e `organizationName` não têm limite de tamanho máximo nem validação de formato de email server-side. Permite payloads muito grandes.

**Solução:** Adicionar validação de comprimento e formato antes do uso:
```typescript
if (!name || name.length > 255 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return error response;
}
if (organizationId && !/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i.test(organizationId)) {
  return error response;
}
```

### Problema 3 — MUITO BAIXO: `update-password` sem limite de tamanho de senha

**Arquivo:** `supabase/functions/update-password/index.ts`

Uma senha de comprimento arbitrário (ex: 10 MB) seria processada pelas 5 expressões regulares de validação de força, causando possível lentidão.

**Solução:** `if (newPassword.length > 1024) return error;` antes da validação.

---

## Arquivos a Modificar

| Arquivo | Tipo de mudança | Severidade |
|---|---|---|
| `supabase/migrations/<ts>_otp_attempt_count.sql` | CRIAR — adicionar coluna `attempt_count` | ALTO |
| `supabase/functions/verify-otp/index.ts` | EDITAR — lógica de contagem de tentativas | ALTO |
| `supabase/functions/create-user/index.ts` | EDITAR — validação de tamanho e formato de email + UUID | BAIXO |
| `supabase/functions/update-password/index.ts` | EDITAR — limite de tamanho de senha | MUITO BAIXO |

**`send-otp`, `process-spreadsheet`, `reprocess-refunds`, `ingest-revenue`, `ingest-stock` não precisam de nenhuma alteração** — estão bem implementados dentro do modelo de segurança do sistema.

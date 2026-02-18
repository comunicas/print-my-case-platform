# Arquitetura — PrintMyCase

## Visão Geral

PrintMyCase é um SaaS multi-tenant construído sobre React + Lovable Cloud. A arquitetura segue o padrão de **Row-Level Security (RLS)** no banco de dados como camada primária de segurança, com Edge Functions para lógica server-side.

---

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER (React SPA)                        │
│                                                                     │
│  Pages → Hooks → Supabase Client SDK → Lovable Cloud (Supabase)    │
│                                                                     │
│  Rotas públicas: /catalogo/:slug, /s/:code                          │
│  Rotas privadas: /, /estoque, /uploads, /marketing, /settings...   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTPS
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│                      LOVABLE CLOUD (Supabase)                        │
│                                                                     │
│  ┌─────────────────┐   ┌──────────────────────────────────────────┐ │
│  │  Auth (JWT)     │   │  Edge Functions (Deno)                   │ │
│  │  - email/senha  │   │  - create-user (JWT)                     │ │
│  │  - OTP via SMS  │   │  - process-spreadsheet (JWT)             │ │
│  └─────────────────┘   │  - update-password (JWT)                 │ │
│                        │  - reprocess-refunds (JWT manual)        │ │
│  ┌─────────────────┐   │  - ingest-revenue (API Key SHA-256)      │ │
│  │  Storage        │   │  - ingest-stock (API Key SHA-256)        │ │
│  │  - uploads/     │   │  - send-otp (público + rate limit)       │ │
│  │  - marketing-   │   │  - verify-otp (público + attempt_count)  │ │
│  │    media/       │   │  - redirect-short-link (público)         │ │
│  │  - catalog-     │   └──────────────────────────────────────────┘ │
│  │    images/      │                                                │
│  └─────────────────┘   ┌──────────────────────────────────────────┐ │
│                        │  PostgreSQL + RLS                         │ │
│                        │  22 tabelas, 18 funções SQL, triggers     │ │
│                        └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP (API Key)
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│                    PDVs FÍSICOS (Vending Machines)                   │
│            POST /ingest-revenue | POST /ingest-stock                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Schema do Banco de Dados

### Tabelas Core

```
organizations          → Tenant raiz. Cada cliente é uma organização.
  ├── pdvs             → Pontos de venda (vending machines) da organização
  │   ├── uploads      → Planilhas carregadas por PDV
  │   │   ├── sales_records    → Registros de vendas processados
  │   │   ├── stock_records    → Registros de estoque processados
  │   │   ├── upload_anomalies → Transações com valores anormais
  │   │   └── stock_history    → Snapshot histórico por marca/PDV
  │   ├── pdv_catalog_settings → Config do catálogo público por PDV
  │   ├── pdv_marketing_media  → Mídias (imagens/áudio/vídeo) por PDV
  │   └── catalog_short_links  → Links curtos para catálogo (/s/:code)
  ├── profiles         → Dados dos usuários da organização
  │   ├── user_roles   → Roles: super_admin | org_admin | operator | viewer
  │   ├── user_pdvs    → Atribuições específicas de PDV por usuário
  │   └── preferences  → Preferências UI (tema, PDV padrão, notificações)
  ├── products         → Catálogo de produtos (price, min_stock, category)
  ├── notifications    → Notificações in-app (upload, pedidos, alertas)
  ├── api_keys         → Chaves de API para ingestão automatizada
  ├── catalog_leads    → Leads do catálogo público (nome, telefone, produto)
  ├── product_requests → Pedidos de produto do catálogo público
  └── audit_logs       → Log de auditoria (criação de usuários, violations)

otp_verifications      → Códigos OTP temporários (5min, máx 5 tentativas)
link_click_events      → Eventos de clique em short links
```

### Funções SQL Importantes

| Função | Propósito |
|---|---|
| `get_user_org_id(user_id)` | Retorna o `organization_id` de um usuário |
| `is_admin(user_id)` | Verifica se é `org_admin` ou `super_admin` |
| `is_super_admin(user_id)` | Verifica se é `super_admin` |
| `user_can_access_pdv(user_id, pdv_id)` | Verifica acesso ao PDV (admin/atribuição/fallback) |
| `can_assign_role(assigner_id, new_role)` | Valida hierarquia ao atribuir role |
| `get_public_stock(org_id, pdv_id?)` | Retorna estoque público sem auth |
| `get_public_organization(slug)` | Retorna org pelo slug público |
| `notify_new_product_request()` | Trigger: notifica admins em novos pedidos |
| `cleanup_expired_otps()` | Trigger: limpa OTPs expirados |
| `handle_new_user()` | Trigger: cria profile + role viewer + preferences |

---

## Fluxo de Autenticação e Autorização

```
Request
  │
  ▼
Edge Function recebe JWT
  │
  ├─ verify_jwt=true  →  Supabase valida automaticamente
  │                      + Código chama getUser() para dupla verificação
  │
  ├─ verify_jwt=false + getClaims()  →  Validação manual (reprocess-refunds)
  │                                     Necessário quando precisamos do role antes de criar client
  │
  └─ API Key (ingest-*)  →  Hash SHA-256 comparado com api_keys.key_hash
                             organization_id derivado da chave (nunca do body)

Frontend
  │
  ▼
Supabase Client SDK faz requests com JWT do usuário logado
  │
  ▼
PostgreSQL evalua RLS policies
  │
  ├─ SELECT: USING clause verifica org/pdv do usuário
  ├─ INSERT: WITH CHECK clause verifica org do usuário
  ├─ UPDATE: USING + WITH CHECK (ambos necessários)
  └─ DELETE: USING clause verifica org + role
```

---

## Política de Segurança RLS

### Camadas de Isolamento

1. **Nível Organização** — `organization_id = get_user_org_id(auth.uid())`
2. **Nível PDV** — `user_can_access_pdv(auth.uid(), pdv_id)`
3. **Nível Usuário** — `user_id = auth.uid()` (para preferences, profile)
4. **Super Admin bypass** — `is_super_admin(auth.uid())` em SELECT policies

### Tabelas com Acesso Público (sem auth)

- `otp_verifications` — via Edge Functions apenas (USING: false bloqueia acesso direto)
- `catalog_leads` — INSERT público com rate limit (1 lead por telefone/org por minuto)
- `product_requests` — INSERT público para orgs com catálogo habilitado

---

## Edge Functions

### Autenticação por Função

| Função | verify_jwt | Auth Adicional |
|---|---|---|
| `create-user` | true | `getUser()` + verificação de role |
| `process-spreadsheet` | true | `getUser()` + UUID de upload válido |
| `update-password` | true | `getUser()` + validação de força |
| `reprocess-refunds` | false | `getClaims()` + `super_admin` no banco |
| `ingest-revenue` | false | API Key SHA-256 |
| `ingest-stock` | false | API Key SHA-256 |
| `send-otp` | false | Rate limit por telefone (3/10min no banco) |
| `verify-otp` | false | `attempt_count` ≤ 5 por OTP |
| `redirect-short-link` | false | Público |

### Sanitização de Inputs

Todas as funções que recebem dados externos implementam:
- `substring(0, N)` — truncamento por tipo de campo
- Regex allowlist — `sanitizeDeviceId()` aceita apenas alphanum + hífens
- `parseAmount()` — clamping entre 0 e 10.000.000
- Limite de 50.000 linhas por planilha (`process-spreadsheet`)

---

## Glossário do Domínio

| Termo | Definição |
|---|---|
| **PDV** | Ponto de Venda — uma vending machine física identificada por `machine_id` |
| **Slot** | Compartimento físico da vending machine (ex: slot A1, B3) |
| **Brand** | Marca do produto extraída do nome (Apple, Samsung, Motorola, Xiaomi) |
| **Upload** | Planilha carregada por um operador (tipo: vendas ou estoque) |
| **OTP** | One-Time Password enviado por SMS para verificar cliente no catálogo |
| **Catalog Lead** | Interesse registrado de um cliente pelo catálogo público |
| **Short Link** | URL encurtada para compartilhar o catálogo (`/s/:code`) |
| **Anomalia** | Transação com valor acima do threshold configurado (padrão: R$2.000) |
| **Stock History** | Snapshot diário de estoque por PDV/marca para gráficos de tendência |
| **org_admin** | Administrador da organização; pode gerenciar equipe, PDVs e uploads |
| **super_admin** | Administrador da plataforma; acesso a todas as organizações |

---

## Decisões Técnicas

### Por que RLS como camada primária?
O multi-tenancy é enforced no banco de dados, não apenas na aplicação. Mesmo que um bug no frontend contorne a lógica de acesso, o banco rejeitará a query pelo RLS. Esta é a abordagem mais segura para SaaS.

### Por que SHA-256 para API Keys?
As chaves nunca são armazenadas em texto plano — apenas o hash. Mesmo que a tabela `api_keys` vaze, as chaves não podem ser reconstituídas.

### Por que attempt_count em vez de rate limit por IP?
Rate limiting por IP é facilmente contornado com proxies ou IPs rotativos. O `attempt_count` por OTP é mais robusto: bloqueia o código específico após 5 tentativas independentemente da origem.

### Por que process-spreadsheet é assíncrono?
Planilhas podem ter até 50.000 linhas e o processamento pode demorar. O upload cria o registro com `status: "processing"` imediatamente (feedback ao usuário) e o processamento ocorre em background, invalidando o cache do React Query ao terminar.

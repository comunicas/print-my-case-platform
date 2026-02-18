# PrintMyCase — Gestão de PDVs

Sistema SaaS multi-tenant para **gestão de pontos de venda (PDVs) de vending machines**. Permite que organizações controlem estoque, vendas, catálogo público e marketing de suas máquinas de forma centralizada.

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui |
| Backend | Lovable Cloud (Supabase) |
| Autenticação | Supabase Auth (e-mail/senha + OTP SMS) |
| Banco de Dados | PostgreSQL com RLS multi-tenant |
| Funções de Backend | Deno Edge Functions |
| SMS/OTP | Twilio |
| Planilhas | xlsx (client-side) + processamento server-side |
| Testes | Vitest (unitários) + Playwright (E2E) |

## Hierarquia de Roles

```
super_admin   → Acesso total a todas as organizações, pode criar orgs e admins
org_admin     → Acesso total à sua organização, gerencia equipe e PDVs
operator      → Pode fazer uploads, visualizar dados da organização
viewer        → Somente leitura dos dados atribuídos
```

Usuários sem atribuição de PDV específica veem **todos os PDVs da organização**.  
Usuários com atribuição veem **apenas os PDVs atribuídos**.

## Fluxos Principais

### 1. Upload de Planilha
1. Usuário acessa `/uploads` e clica em "Novo Upload"
2. Seleciona PDV, tipo (Vendas/Estoque), período e arquivo `.xlsx`
3. Client-side valida colunas obrigatórias via `validateSpreadsheetColumns()`
4. Arquivo é salvo no storage e registro criado com `status: "processing"`
5. Edge Function `process-spreadsheet` processa em background
6. Registros inseridos em `sales_records` ou `stock_records`
7. Status atualizado para `"ready"` ou `"error"`

### 2. Catálogo Público (OTP)
1. Cliente acessa `/catalogo/:orgSlug`
2. Visualiza estoque disponível (via `get_public_stock()` sem autenticação)
3. Para solicitar produto, fornece telefone e recebe SMS com OTP (via Twilio)
4. `verify-otp` valida o código (máx 5 tentativas por OTP)
5. Lead registrado em `catalog_leads`

### 3. Ingestão por API (PDVs automatizados)
1. Administrador gera API Key nas configurações
2. PDV envia dados via `POST /functions/v1/ingest-revenue` ou `/ingest-stock`
3. Autenticação via `X-API-Key` com hash SHA-256
4. Sanitização completa de inputs, clamping de valores numéricos
5. Dados inseridos diretamente em `sales_records` / `stock_records`

## Pré-requisitos

- Node.js 18+ (ou Bun)
- Conta no [Lovable](https://lovable.dev) (para backend)

## Como Rodar Localmente

```sh
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# O arquivo .env é gerado automaticamente pelo Lovable Cloud
# Para desenvolvimento local, copie e ajuste:
cp .env.example .env

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`.

## Como Rodar os Testes

```sh
# Testes unitários (Vitest)
npm run test

# Testes unitários com UI
npm run test:ui

# Testes E2E (Playwright) — requer servidor rodando
npx playwright test

# Testes E2E com UI
npx playwright test --ui
```

## Estrutura de Pastas

```
src/
├── assets/brands/          # Logos das marcas (Apple, Samsung, Motorola, Xiaomi)
├── components/
│   ├── dashboard/          # Gráficos e KPIs do dashboard
│   ├── layout/             # AppLayout, AppSidebar, AppHeader
│   ├── marketing/          # Cupons, mídias, analytics, lightbox
│   ├── pdv/                # Formulário de PDV
│   ├── public/             # Componentes do catálogo público
│   ├── settings/           # Abas de configurações
│   ├── stock/              # Grade e tabela de estoque, analytics de produto
│   ├── team/               # Gestão de equipe
│   ├── ui/                 # Componentes base (shadcn/ui customizados)
│   └── upload/             # Dialog de upload de planilhas
├── contexts/               # AuthContext, ProductModalContext, StockFiltersContext
├── hooks/                  # 35+ hooks de dados e UX
├── integrations/supabase/  # Cliente e tipos gerados automaticamente
├── lib/
│   ├── schemas/            # Schemas Zod e tipos (auth, upload, pdv, team...)
│   ├── utils/              # Utilitários (spreadsheet-validator, date-presets...)
│   ├── brandAssets.ts      # Mapeamento de marcas → logos e cores
│   ├── constants.ts        # Constantes centralizadas (ANOMALY_VALUE_THRESHOLD, etc.)
│   ├── dashboardUtils.ts   # Funções puras de cálculo do dashboard
│   ├── productNormalization.ts # Normalização e matching de nomes de produtos
│   ├── stockUtils.ts       # Utilitários de estoque
│   └── utils.ts            # formatCurrency, cn, etc.
├── pages/                  # 10 páginas (Auth, Index, Stock, Uploads, Marketing...)
└── supabase/functions/     # 8 Edge Functions (Deno)
    ├── create-user/
    ├── ingest-revenue/
    ├── ingest-stock/
    ├── process-spreadsheet/
    ├── redirect-short-link/
    ├── reprocess-refunds/
    ├── send-otp/
    ├── update-password/
    └── verify-otp/

e2e/                        # Testes Playwright
docs/                       # Documentação de arquitetura
```

## Variáveis de Ambiente

| Variável | Descrição | Onde Configurar |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Lovable Cloud | Auto-gerado |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do projeto | Auto-gerado |
| `TWILIO_ACCOUNT_SID` | SID da conta Twilio (para OTP SMS) | Secrets do projeto |
| `TWILIO_AUTH_TOKEN` | Token de autenticação Twilio | Secrets do projeto |
| `TWILIO_PHONE_NUMBER` | Número de telefone Twilio | Secrets do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (apenas Edge Functions) | Auto-gerado |

## Segurança

- **RLS em 100% das tabelas** — isolamento multi-tenant por `organization_id`
- **Edge Functions com JWT dupla verificação** — `verify_jwt = true` + `getUser()` server-side
- **Anti-brute-force no OTP** — máx 5 tentativas por código via `attempt_count`
- **Sanitização de inputs** — limites de tamanho, regex, clamping numérico
- **API Keys com hash SHA-256** — sem armazenamento de chaves em texto plano
- **Hierarquia de roles** — `org_admin` não pode criar `super_admin` ou acessar outras orgs

## Deploy

O deploy é gerenciado automaticamente pelo Lovable. Para publicar:

1. Acesse o projeto em [lovable.dev](https://lovable.dev)
2. Clique em **Share → Publish**

Para domínio customizado, vá em **Project → Settings → Domains**.

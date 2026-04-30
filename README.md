# Print My Case Platform

Aplicação web para operação de PDVs da Print My Case, com catálogo público,
gestão de estoque e vendas, uploads de planilhas, marketing, financeiro, equipe
e integrações via Supabase.

URL pública: https://printmycase.comunicas.com.br/

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS e shadcn/ui.
- Estado e dados: TanStack Query, Context API e Supabase JS.
- Backend: Supabase Auth, Postgres, RLS, Storage e Edge Functions.
- Testes: Vitest para unidade/componentes e Playwright para e2e.
- Package manager oficial: npm, com `package-lock.json` versionado.

## Setup local

Requisitos:

- Node.js 20 ou superior.
- npm 10 ou superior.
- Acesso ao projeto Supabase e às variáveis de ambiente.

```bash
npm ci
npm run dev
```

Comandos principais:

```bash
npm run build
npm run preview
npm run lint
npm run test
```

O servidor de desenvolvimento usa a porta `8080`, conforme `vite.config.ts`.

### Testes E2E (Playwright)

Os testes em `e2e/` rodam contra o build de preview local e exigem credenciais
de um usuário de teste autorizado:

```bash
export TEST_USER_EMAIL="usuario-de-teste@exemplo.com"
export TEST_USER_PASSWORD="senha-do-usuario-de-teste"
npm run build
npx playwright install --with-deps   # primeira execução apenas
npx playwright test                  # todos os specs
npx playwright test e2e/legacy-redirects.spec.ts   # apenas redirects legados
```

Nunca commitar `TEST_USER_EMAIL` ou `TEST_USER_PASSWORD`. Use uma conta
descartável de teste, sem dados sensíveis.

## Variáveis de ambiente

Frontend (`.env`):

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase usado pelo frontend. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave pública anon/publishable do Supabase. |
| `VITE_FEATURE_INGEST_REVENUE_ENABLED` | Não | Habilita a exposição da ingestão de receita quando o backend também estiver habilitado. Default: `false`. |

Supabase Edge Functions:

| Variável | Obrigatória | Uso |
|---|---:|---|
| `SUPABASE_URL` | Sim | URL do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Operações server-side privilegiadas. |
| `SUPABASE_ANON_KEY` | Depende da função | Chamadas públicas específicas. |
| `TWILIO_ACCOUNT_SID` | Apenas OTP | Envio de SMS. |
| `TWILIO_AUTH_TOKEN` | Apenas OTP | Autenticação Twilio. |
| `TWILIO_PHONE_NUMBER` | Apenas OTP | Número emissor de SMS. |
| `INGEST_REVENUE_ENABLED` | Não | Libera a função `ingest-revenue`. Default: `false`. |

Nunca versionar `.env`, secrets Supabase, service role keys, tokens, OTPs ou chaves
de API.

## Mapa da aplicação

Rotas públicas:

- `/catalogo/:orgSlug`: catálogo público de produtos por organização/PDV.
- `/s/:code`: redirecionamento de link curto para catálogo ou destino configurado.

Rotas autenticadas:

- `/auth`: login, cadastro, recuperação e troca de senha.
- `/`: dashboard operacional e financeiro.
- `/uploads` e `/uploads/:id`: envio, listagem e análise de planilhas.
- `/estoque`, `/estoque/tabela`, `/estoque/compras`: visão de estoque, tabela/mapa de slots e pré-estoque.
- `/marketing`: cupons, mídias, catálogos, pedidos, vendas, leads e analytics.
- `/financeiro`: resumo financeiro, DRE, despesas e comparações entre PDVs.
- `/settings`: perfil, preferências, organização, PDVs, equipe e integrações.
- `/organizations`: administração de organizações para super admins.

Rotas legadas mantidas como redirecionamento:

- `/reports` -> `/estoque`
- `/vitrine` -> `/marketing?tab=midias`
- `/pdvs` -> `/settings?tab=pdvs`
- `/team` -> `/settings?tab=team`

## Documentação

- Arquitetura: `docs/architecture.md`
- Guia de produto: `docs/product-guide.md`
- Deploy: `docs/deployment.md`
- Runbook operacional: `docs/operations/runbook.md`
- Status de features: `docs/operations/feature-status.md`
- Logs e dados sensíveis: `docs/operations/log-review-report.md`
- CI: `docs/ci.md`
- ADR de package manager: `docs/adr/0001-package-manager-and-scripts.md`

## Deploy resumido

1. Aplicar migrations Supabase no ambiente alvo.
2. Publicar Edge Functions necessárias.
3. Configurar secrets Supabase e variáveis `VITE_*`.
4. Rodar `npm ci`, `npm run test`, `npm run lint` e `npm run build`.
5. Publicar `dist/` no provedor web.
6. Validar login, dashboard, catálogo público, upload, integrações e logs.

Detalhes completos em `docs/deployment.md`.

## Operação

- API keys de integração são gerenciadas em **Configurações > Integrações**.
- Logs frontend devem passar por `clientLog`.
- Logs de Edge Functions devem usar JSON estruturado e mascarar campos sensíveis.
- `ingest-stock` está ativa; `ingest-revenue` permanece desativada por feature flag.
- Alterações estruturais devem ser registradas em ADR.

## Troubleshooting rápido

- Front não sobe: conferir Node 20+, `npm ci` e variáveis `VITE_*`.
- Usuário não acessa: validar sessão Supabase, perfil, role e organização ativa.
- Dashboard sem dados: verificar PDV ativo, uploads processados, RLS e período filtrado.
- Edge Function retorna 401: conferir `Authorization: Bearer <api_key>` e status da chave.
- Catálogo público não abre: validar slug, status do catálogo, dados de estoque e rota `/catalogo/:orgSlug`.

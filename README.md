# Print My Case Platform

Plataforma web para operação de PDVs (pontos de venda) com foco em:
- ingestão e consolidação de estoque/vendas,
- dashboards operacionais e financeiros,
- gestão de organização, equipe e integrações.

## Arquitetura

### Visão geral
- **Frontend SPA**: React + Vite + TypeScript (pasta `src/`).
- **Dados e autenticação**: Supabase (Postgres + Auth + RLS).
- **Back-end serverless**: Supabase Edge Functions (pasta `supabase/functions/`).

### Componentes principais
- **Camada de UI**: `src/components/*` com shadcn/ui e Tailwind.
- **Páginas e rotas**: `src/pages/*` e definição de rotas em `src/App.tsx`.
- **Estado assíncrono**: TanStack Query para cache e sincronização.
- **Contextos de negócio**: autenticação, perfil, organização ativa e modal de produto.
- **Edge Functions**:
  - `ingest-stock`: endpoint ativo para ingestão de estoque.
  - `ingest-revenue`: endpoint oficialmente desativado por feature flag (ver seção de flags).
  - demais funções utilitárias (OTP, redirecionamento, usuário, processamento).

### Fluxo de dados (resumo)
1. Usuário autentica via Supabase Auth.
2. Frontend consulta dados no Supabase com políticas RLS.
3. Integrações externas enviam dados para Edge Functions (quando habilitadas).
4. Dashboards consomem tabelas/funções SQL consolidadas.

## Stack e padrão oficial de ferramentas

- **Runtime local**: Node.js 20+
- **Package manager oficial**: **npm**
- **Build**: Vite
- **Testes**: Vitest e Playwright

> Decisão registrada em `docs/adr/0001-package-manager-and-scripts.md`.

## Variáveis de ambiente

### Frontend (`.env`)
| Variável | Obrigatória | Descrição |
|---|---:|---|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave pública (anon/publishable) do Supabase. |
| `VITE_FEATURE_INGEST_REVENUE_ENABLED` | Não (default `false`) | Exibe/oculta o endpoint de ingestão de receita na UI e sinaliza status da feature. |

### Edge Functions (Supabase secrets)
| Variável | Obrigatória | Uso |
|---|---:|---|
| `SUPABASE_URL` | Sim | Cliente server-side das funções. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Operações privilegiadas nas funções. |
| `SUPABASE_ANON_KEY` | Depende da função | Chamadas públicas específicas. |
| `TWILIO_ACCOUNT_SID` | Apenas OTP | Integração de envio de SMS/OTP. |
| `TWILIO_AUTH_TOKEN` | Apenas OTP | Credencial da API Twilio. |
| `TWILIO_PHONE_NUMBER` | Apenas OTP | Número emissor do SMS. |
| `INGEST_REVENUE_ENABLED` | Não (default `false`) | Habilita/desabilita o endpoint `ingest-revenue` no backend. |

## Setup local

```bash
npm ci
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

## CI/CD (padrão oficial)

- O pipeline oficial usa **apenas npm**.
- Instalação de dependências no CI/CD deve ser feita com `npm ci`.
- O projeto versiona somente `package-lock.json`.
- O check `npm run check:lockfiles` bloqueia lockfiles não oficiais (`bun.lock`, `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`).

## Deploy (fluxo recomendado)

### 1) Banco e funções Supabase
1. Aplicar migrações no ambiente alvo.
2. Publicar Edge Functions necessárias.
3. Configurar/validar secrets por ambiente.

### 2) Frontend
1. Definir variáveis `VITE_*` do ambiente.
2. Executar `npm ci` seguido de `npm run build`.
3. Publicar artefatos (`dist/`) no provedor web.

### 3) Pós-deploy (checklist)
- Login e navegação básica.
- Dashboard principal carregando sem erro de query.
- Página de integrações respeitando flags de feature.
- Saúde dos endpoints ativos de integração.

## Operação

- Matriz de status de features e responsáveis: `docs/operations/feature-status.md`.
- Integridade de API Keys de integração é gerenciada em **Configurações > Integrações**.
- Para mudanças estruturais, criar ADR em `docs/adr/`.

## Troubleshooting

### Front não sobe em desenvolvimento
- Verifique versão do Node (20+).
- Remova `node_modules` e rode `npm ci` novamente.
- Confirme variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.

### Erro de autenticação/consulta no Supabase
- Validar sessão do usuário e organização ativa.
- Conferir políticas RLS/tabelas usadas pela tela.
- Inspecionar logs no navegador e no painel do Supabase.

### Edge Function retorna 401
- Confirmar header `Authorization: Bearer <api_key>`.
- Verificar se API key está ativa na organização correta.

### `ingest-revenue` indisponível
- Comportamento esperado quando a feature está desativada.
- Para habilitar temporariamente:
  - frontend: `VITE_FEATURE_INGEST_REVENUE_ENABLED=true`
  - backend: secret `INGEST_REVENUE_ENABLED=true`
- Habilitação deve ser acompanhada por responsável técnico e monitoramento.

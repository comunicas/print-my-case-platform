# Arquitetura

Atualizado em: **2026-04-30**

## Visão geral

O Print My Case Platform é uma SPA React hospedada em domínio próprio e integrada
ao Supabase. O frontend concentra a experiência operacional e o Supabase fornece
autenticação, dados, RLS, funções serverless e integrações.

Fluxo principal:

1. O usuário autentica em `/auth` via Supabase Auth.
2. `AuthProvider`, `ProfileProvider` e `ActiveOrgProvider` carregam sessão, perfil, role e organização ativa.
3. As páginas protegidas consultam dados via hooks com TanStack Query.
4. Uploads e integrações acionam Edge Functions.
5. Dashboards, estoque, marketing e financeiro leem tabelas, views e funções SQL sob RLS.

## Frontend

Entrypoints:

- `src/main.tsx`: monta o React no elemento `#root`.
- `src/App.tsx`: configura providers, roteamento público/protegido e fallback de loading.
- `src/index.css` e `tailwind.config.ts`: tema visual, tokens e estilos globais.

Providers globais:

- `QueryClientProvider`: cache, retry e sincronização de consultas.
- `ThemeProvider`: tema claro/escuro/sistema.
- `TooltipProvider` e `Sonner`: UI global.
- `ErrorBoundary`: captura falhas de renderização e envia logs sanitizados.
- `AuthProvider`: sessão Supabase.
- `ProfileProvider`: perfil, role e permissões.
- `ActiveOrgProvider`: organização ativa e visão consolidada.
- `ProductModalProvider`: modal global de produto.

## Rotas

Rotas públicas, fora do `AuthProvider`:

- `/catalogo/:orgSlug`: catálogo público.
- `/s/:code`: link curto.

Rotas protegidas:

- `/`: dashboard.
- `/uploads` e `/uploads/:id`: upload e detalhes.
- `/estoque`, `/estoque/tabela`, `/estoque/compras`: estoque.
- `/marketing`: marketing e catálogo.
- `/financeiro`: DRE e despesas.
- `/settings`: perfil, preferências, organização, PDVs, equipe e integrações.
- `/organizations`: gestão multi-organização para super admins.

Rotas legadas redirecionam para os destinos atuais em vez de renderizar páginas
antigas.

## Dados e hooks

Os hooks em `src/hooks` encapsulam queries e mutations do Supabase. Padrões atuais:

- Hooks recebem filtros de organização, PDV, período e permissões.
- TanStack Query controla cache, loading e refetch.
- Mutations invalidam caches relacionados após criação, edição ou exclusão.
- Filtros de PDV usam preferência padrão quando disponível.

Áreas principais:

- Dashboard: `useDashboard`, `useDashboardDataRange`, `useDRE`.
- Estoque: `useProductStock`, `useSlotsData`, `useStockHistory`, `usePreStock`.
- Uploads: `useUploads`, `useUploadDetails`, `useSalesRecords`.
- Marketing: `usePDVMarketingMedia`, `usePDVCatalogSettings`, `useProductRequests`, `useCatalogLeads`.
- Configurações: `useProfile`, `usePreferences`, `useOrganization`, `usePDVs`, `useTeamMembers`, `useApiKeys`.

## Permissões

Roles observadas no frontend:

- `super_admin`: acesso consolidado, organizações, gestão ampla e mídias globais.
- `org_admin`: administração da própria organização.
- `operator`: operação de uploads/estoque conforme permissões.
- `viewer`: leitura e navegação sem ações administrativas.

O frontend oculta ou redireciona partes da UI, mas a segurança final depende das
políticas RLS e das validações nas Edge Functions.

## Supabase

Configuração:

- Projeto local em `supabase/config.toml`.
- Client tipado em `src/integrations/supabase/client.ts`.
- Tipos gerados em `src/integrations/supabase/types.ts`.
- Migrations SQL em `supabase/migrations`.

Edge Functions:

- `process-spreadsheet`: processa planilhas de upload.
- `ingest-stock`: endpoint ativo de integração de estoque.
- `ingest-revenue`: endpoint controlado por feature flag e desativado por padrão.
- `send-otp` e `verify-otp`: fluxo OTP por SMS.
- `create-user`, `update-password`, `delete-user`: administração de usuários.
- `redirect-short-link`: resolve links curtos públicos.
- `submit-catalog-lead`: recebe leads do catálogo público.

## Observabilidade

- Frontend usa `clientLog(level, eventType, fields)` para logs sanitizados.
- Edge Functions devem usar helpers compartilhados em `supabase/functions/_shared/observability.ts`.
- Campos com nomes de token, senha, e-mail, telefone, API key, OTP ou service role devem ser mascarados.
- Eventos persistentes de auditoria ficam no banco e são documentados em `docs/operations/audit-event-taxonomy.md`.

## Build e CI

- `npm ci` instala dependências reprodutíveis.
- `npm run test` executa Vitest.
- `npm run lint` executa ESLint no repositório.
- `npm run build` gera o bundle em `dist/`.
- Playwright cobre fluxos e2e em `e2e/`, com base URL `http://localhost:8080`.

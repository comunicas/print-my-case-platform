# Deploy

Atualizado em: **2026-04-30**

## Ambientes

O ambiente público atual usa o domínio:

- https://printmycase.comunicas.com.br/

O frontend é uma SPA Vite. O backend operacional fica no Supabase, incluindo
banco, Auth, RLS, Storage e Edge Functions.

## Pré-requisitos

- Node.js 20+.
- npm 10+.
- Acesso ao projeto Supabase.
- Variáveis `VITE_*` configuradas no provedor web.
- Supabase secrets configurados por ambiente.

## Checklist antes do deploy

1. Confirmar branch e diff.
2. Rodar `npm ci`.
3. Rodar `npm run test`.
4. Rodar `npm run lint`.
5. Rodar `npm run build`.
6. Revisar migrations pendentes em `supabase/migrations`.
7. Revisar Edge Functions alteradas.
8. Conferir que nenhum segredo foi versionado.

## Banco de dados

Aplicar migrations Supabase antes de publicar frontend que dependa de nova
estrutura de dados.

Cuidados:

- Migrations devem ser idempotentes quando possível.
- Alterações em enum devem considerar ambientes já parcialmente atualizados.
- Mudanças de RLS devem ser testadas com roles reais.
- Migrations que tocam dados operacionais devem ter plano de rollback ou script de correção.

## Edge Functions

Funções atuais:

- `process-spreadsheet`
- `ingest-stock`
- `ingest-revenue`
- `redirect-short-link`
- `send-otp`
- `verify-otp`
- `submit-catalog-lead`
- `create-user`
- `update-password`
- `delete-user`

Depois do deploy das funções:

- Validar logs estruturados.
- Confirmar secrets exigidos.
- Testar status HTTP esperado para sucesso e erro.
- Confirmar que campos sensíveis permanecem mascarados.

## Frontend

Build:

```bash
npm ci
npm run build
```

Publicar o conteúdo de `dist/` no provedor web. O provedor deve redirecionar
requisições SPA para `index.html`, preservando rotas como `/auth`,
`/settings`, `/catalogo/:orgSlug` e `/s/:code`.

## Variáveis

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_FEATURE_INGEST_REVENUE_ENABLED`

Supabase secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `INGEST_REVENUE_ENABLED`

## Pós-deploy

Smoke test mínimo:

- Abrir `https://printmycase.comunicas.com.br/`.
- Validar redirecionamento para `/auth` quando sem sessão.
- Fazer login com usuário de teste autorizado.
- Abrir dashboard.
- Abrir estoque em tabela e mapa.
- Abrir uploads e detalhes de um upload processado.
- Abrir marketing e catálogo público.
- Abrir financeiro.
- Abrir configurações e integrações.
- Verificar logs do navegador e do Supabase.

## Rollback

Frontend:

- Reverter para o build anterior no provedor.
- Se o erro depender de variável, restaurar o valor anterior.

Supabase:

- Preferir migration corretiva em vez de apagar migration aplicada.
- Para Edge Functions, republicar a versão anterior.
- Se segredo foi exposto, revogar primeiro, depois limpar histórico.

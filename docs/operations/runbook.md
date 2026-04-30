# Runbook operacional

Atualizado em: **2026-04-30**

## Objetivo

Este runbook orienta triagem de incidentes e manutenção diária do Print My Case
Platform.

## Saúde rápida

Verificar:

- Frontend carrega no domínio público.
- `/auth` renderiza sem erro.
- Login funciona com usuário de teste.
- Dashboard carrega dados para organização ativa.
- Catálogo público abre por slug conhecido.
- Edge Functions críticas respondem conforme esperado.
- Logs não exibem OTP, telefone, e-mail, senha, token ou API key em texto aberto.

## Login e autenticação

Sintomas comuns:

- Usuário fica preso em loading.
- Usuário volta para `/auth`.
- Perfil carrega sem role.
- Organização ativa não aparece.

Triagem:

1. Confirmar sessão Supabase.
2. Conferir registro em `profiles`.
3. Conferir role e vínculo com organização.
4. Validar RLS das tabelas acessadas.
5. Verificar console sanitizado e logs Supabase.

## Dashboard sem dados

Triagem:

1. Conferir período selecionado.
2. Conferir PDV selecionado ou preferência de PDV padrão.
3. Validar uploads de vendas e estoque processados.
4. Checar RLS para a organização ativa.
5. Revisar queries usadas por `useDashboard`, `useDRE` e hooks relacionados.

## Upload com erro

Triagem:

1. Conferir tipo do upload: `sales` ou `stock`.
2. Validar formato da planilha.
3. Conferir status do upload em `/uploads/:id`.
4. Revisar logs da Edge Function `process-spreadsheet`.
5. Conferir se o PDV pertence à organização ativa.
6. Verificar se o processamento criou registros e notificações esperadas.

## Ingestão de estoque

`ingest-stock` está ativa e protegida por API key.

Triagem:

1. Conferir header `Authorization: Bearer <api_key>`.
2. Confirmar API key ativa em **Configurações > Integrações**.
3. Validar organização vinculada à chave.
4. Conferir payload do parceiro sem registrar dados sensíveis.
5. Revisar eventos estruturados da função.

## Ingestão de receita

`ingest-revenue` permanece desativada por padrão.

Para habilitar temporariamente:

- Frontend: `VITE_FEATURE_INGEST_REVENUE_ENABLED=true`.
- Backend: `INGEST_REVENUE_ENABLED=true`.

Somente habilitar com responsável técnico acompanhando logs e validação de dados.

## OTP

Funções relacionadas:

- `send-otp`
- `verify-otp`

Triagem:

1. Conferir secrets Twilio.
2. Verificar status HTTP retornado pela Twilio.
3. Validar limite de tentativas, se aplicável.
4. Confirmar que telefone e código não aparecem em logs.
5. Validar mensagens seguras para o usuário.

## Catálogo público

Triagem:

1. Conferir slug da organização.
2. Validar status do catálogo e PDV.
3. Conferir estoque disponível.
4. Testar busca e filtro por marca.
5. Validar formulário de solicitação.
6. Conferir eventos de lead quando QR/código estiver habilitado.

## Financeiro

Triagem:

1. Conferir mês de referência.
2. Validar filtro de PDV.
3. Conferir despesas cadastradas.
4. Confirmar dados de vendas do período.
5. Revisar DRE e comparativo entre PDVs.

## Logs e dados sensíveis

Regra operacional:

- Não logar senha, OTP, token, telefone, e-mail, API key, service role key ou payload bruto de provedor.
- Frontend deve usar `clientLog`.
- Edge Functions devem usar helpers estruturados e sanitização.
- Auditoria persistida deve usar IDs internos quando possível.

## PRs e CI

Antes de merge:

- `npm ci`
- `npm run test`
- `npm run lint`
- `npm run build`

Se o CI falhar:

- Corrigir build/test/lint antes do merge.
- Não enfraquecer checks sem ADR ou documento operacional.
- Verificar PRs antigas de CI/lint antes de alterar os mesmos arquivos.

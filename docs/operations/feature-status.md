# Feature status matrix

Atualizado em: **2026-04-30**

| Feature | Status | Flag / Controle | Owner | Observações operacionais |
|---|---|---|---|---|
| Ingestão de estoque (`ingest-stock`) | Ativa | API Key + função Supabase | Time Backend / Operações de Dados | Endpoint produtivo para atualização de estoque. |
| Ingestão de receita (`ingest-revenue`) | **Desativada** | `VITE_FEATURE_INGEST_REVENUE_ENABLED` + `INGEST_REVENUE_ENABLED` | Time Backend | Endpoint com bloqueio explícito por feature flag; não expor para parceiros enquanto desativado. |
| API Keys de integração | Ativa | Tela de Configurações + tabela `api_keys` | Time Backend / Segurança | Revogação e auditoria de uso por organização. |
| Dashboard financeiro e operacional | Ativa | Acesso autenticado + organização ativa | Time Produto | Depende de consistência de dados de vendas, estoque e regras SQL. |
| OTP (send/verify) | Ativa conforme secrets | Secrets Twilio | Time Backend / Segurança | Exige credenciais Twilio válidas no ambiente alvo. |
| Busca unificada com autocomplete | Ativa | `ProductSearchAutocomplete` | Time Produto (Estoque) | Usada na tabela e em compras, com sugestões e logo de marca. |
| Header responsivo | Ativa | Breakpoints CSS (`sm`/`md`/`lg`) | Time Produto (Layout) | Logo, OrgSwitcher e touch targets adaptados por viewport. |
| Configurações centralizadas no header | Ativa | Dropdown do perfil | Time Produto (Layout) | Acesso único pelo header; sidebar mantém apenas navegação principal. |
| Observabilidade estruturada | Ativa | `clientLogger` + helper Edge Function | Time Backend / Frontend | Logs sensíveis devem ser mascarados; ver `docs/operations/log-review-report.md`. |
| Catálogo público | Ativa | `/catalogo/:orgSlug` + `/s/:code` | Time Produto (Marketing) | Busca, filtro por marca, compartilhamento, localização, solicitações e QR/código quando habilitado. |
| Financeiro | Ativa | `/financeiro` + roles admin | Time Produto (Financeiro) | DRE, despesas, resumo mensal e comparação entre PDVs. |
| Rotas legadas redirecionadas | Ativa | `Navigate` no React Router | Time Frontend | `/reports`, `/vitrine`, `/pdvs` e `/team` preservam links antigos sem manter telas duplicadas. |

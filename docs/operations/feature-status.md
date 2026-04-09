# Feature status matrix

Atualizado em: **2026-04-09**

| Feature | Status | Flag / Controle | Owner | Observações operacionais |
|---|---|---|---|---|
| Ingestão de estoque (`ingest-stock`) | Ativa | API Key + função Supabase | Time Backend / Operações de Dados | Endpoint produtivo para atualização de estoque. |
| Ingestão de receita (`ingest-revenue`) | **Desativada** | `VITE_FEATURE_INGEST_REVENUE_ENABLED` + `INGEST_REVENUE_ENABLED` | Time Backend | Endpoint com bloqueio explícito por feature flag; não expor para parceiros enquanto desativado. |
| API Keys de integração | Ativa | Tela de Configurações + tabela `api_keys` | Time Backend / Segurança | Revogação e auditoria de uso por organização. |
| Dashboard financeiro (DRE e KPIs) | Ativa | Acesso autenticado + organização ativa | Time Produto (Financeiro) | Depende de consistência de dados de vendas e regras SQL. |
| OTP (send/verify) | Ativa (conforme secrets) | Secrets Twilio | Time Backend / Segurança | Exige credenciais Twilio válidas no ambiente alvo. |
| Busca unificada com autocomplete | Ativa | Componente `ProductSearchAutocomplete` | Time Produto (Estoque) | Mesmo componente na Tabela e Compras; sugestões com logo de marca e highlight. |
| Header responsivo | Ativa | Breakpoints CSS (`sm`/`md`/`lg`) | Time Produto (Layout) | Logo, OrgSwitcher e touch targets adaptados por viewport. |
| Configurações centralizado no header | Ativa | Dropdown do perfil | Time Produto (Layout) | Acesso único pelo header; removido do rodapé do sidebar. |

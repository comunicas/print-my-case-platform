

## Plano de Correção Completa — Dividido em Etapas

### Estado Atual

| Item | Status |
|------|--------|
| RPC `get_dre_sales_summary` | ✅ Corrigida com allowlist |
| RPC `get_annual_dre_summary` | ✅ Corrigida com allowlist |
| Dados no banco (`payment_method`) | ✅ Normalizados PT-BR (940 registros) |
| Dados no banco (`status`) | ✅ Normalizados PT-BR (940 registros) |
| Edge Function `ingest-revenue` | 🔒 Desabilitada (503) — aguardando Etapa 6 |
| Edge Function `process-spreadsheet` | ⏳ Etapa 3 |
| Frontend `SalesRecordsTab` | ✅ Labels já mapeados |

### Distribuição por PDV

| PDV | Registros |
|-----|-----------|
| Boulevard Tatuapé | 220 |
| Extra Ricardo Jafet | 10 |
| Tietê Plaza Shopping | 710 |
| **Total** | **940** |

---

### Etapa 1 — Corrigir RPCs ✅ CONCLUÍDA

### Etapa 2 — Desabilitar API + Importar planilha ✅ CONCLUÍDA

- API `ingest-revenue` retorna 503
- 151 registros antigos deletados
- 940 registros importados da planilha com normalização PT-BR
- `payment_method`: Cartão de Crédito (896), Cortesia (35), Cupom (6), Não informado (3)
- `status`: Concluído (940)

---

### Etapa 3 — Normalizar `process-spreadsheet`

Garantir que planilhas de vendas gravem valores PT-BR canônicos na ingestão.

---

### Etapa 4 — Simplificar RPCs e frontend

Após normalização completa, simplificar RPCs para filtrar apenas valores canônicos e reduzir mapeamentos no frontend.

---

### Etapa 5 — Rotina de limpeza de uploads antigos (opcional)

Manter apenas uploads de estoque mais recentes por PDV.

---

### Etapa 6 — Reativar API `ingest-revenue` com normalização

Atualizar mapeamentos para PT-BR canônico e remover bloqueio 503.

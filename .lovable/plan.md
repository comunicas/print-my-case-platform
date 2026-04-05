

## Plano de Correção Completa — Atualizado

### Mudança no Plano

A API de ingestão (`ingest-revenue`) será **desabilitada temporariamente** para evitar que novos dados entrem com formato inconsistente enquanto organizamos o banco. Após a normalização completa, a API será reativada com os mapeamentos corretos.

---

### Estado Atual

| Item | Status |
|------|--------|
| RPC `get_dre_sales_summary` | ✅ Corrigida (Etapa 1 executada) |
| RPC `get_annual_dre_summary` | ✅ Já corrigida com allowlist |
| Dados no banco (`payment_method`) | ❌ Valores crus: `creditCard`, `debitCard`, `pix` |
| Dados no banco (`status`) | ⚠️ Parcial |
| Edge Function `ingest-revenue` | 🔒 Será desabilitada temporariamente |
| Edge Function `process-spreadsheet` | Precisa verificar normalização |
| Frontend `SalesRecordsTab` | ✅ Labels já mapeados |

---

### Etapa 1 — Corrigir RPC `get_dre_sales_summary` ✅ CONCLUÍDA

Migration executada com allowlist de status e payment_methods expandida.

---

### Etapa 2 — Desabilitar API `ingest-revenue` + Importar planilha completa

**2a.** Desabilitar a Edge Function `ingest-revenue` (retornar 503 com mensagem "API temporariamente desabilitada para manutenção").

**2b.** Limpar todos os registros existentes em `sales_records` (151 registros inconsistentes da API).

**2c.** Importar a planilha `REVENUE-FULL-PDVS.xlsx` com normalização PT-BR:
- Mapear `device_id` → `pdv_id` (1001013→Boulevard, 1000838→Extra RJ, 1001543→Tietê)
- `payment_method`: `creditCard`→`Cartão de Crédito`, `debitCard`→`Cartão de Débito`, `pix`→`PIX`, `machineFree`→`Cortesia`
- `status`: `Completed`→`Concluído`, `Cancelled`→`Cancelado`
- Filtrar até 04/04/2026 (excluir hoje)

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

Somente após dados organizados: atualizar os mapeamentos da API para gravar valores PT-BR canônicos e remover o bloqueio 503.

---

### Próximo Passo: Etapa 2

**Escopo**: Desabilitar `ingest-revenue`, limpar `sales_records` e importar ~900+ registros da planilha com normalização PT-BR para os 3 PDVs.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ingest-revenue/index.ts` | Retornar 503 (desabilitado) |
| Script Python (temporário) | Importar XLSX → banco com normalização |
| Migration SQL | DELETE dos registros antigos |


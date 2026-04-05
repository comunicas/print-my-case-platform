# Roadmap de Normalização de Dados — Status

## Visão Geral

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 1 | Corrigir RPCs financeiras (`get_dre_sales_summary`) | ✅ Concluída |
| 2 | Desabilitar API, limpar banco e importar dados normalizados | ✅ Concluída |
| 3 | Normalizar Edge Function `process-spreadsheet` para PT-BR | ✅ Concluída |
| 4 | Simplificar RPCs e frontend (remover mapeamentos EN→PT) | ✅ Concluída |
| 5 | Rotina de limpeza de uploads de estoque antigos | ✅ Concluída |
| 6 | Reativar `ingest-revenue` com normalização PT-BR | ⏳ Pendente |

---

## Etapa 1 — Corrigir RPCs Financeiras ✅

- Recriada `get_dre_sales_summary` com allowlist `IN ('Completed','Pago','Concluído')` em vez de blocklist `!= 'Cancelled'`.
- Adicionadas variantes de `payment_method` para capturar cartão de crédito/débito em EN e PT.

## Etapa 2 — Reset e Importação Normalizada ✅

- `ingest-revenue` desabilitada (retorna 503).
- Todos os `sales_records` antigos deletados.
- 934 registros importados da planilha `REVENUE-FULL-PDVS.xlsx` com valores canônicos PT-BR.
- Mapeamento por `device_id` → `pdv_id` para os 3 PDVs (Boulevard, Extra Ricardo Jafet, Tietê).

## Etapa 3 — Normalizar `process-spreadsheet` ✅

- Funções `normalizePaymentMethod()` e `normalizeStatus()` adicionadas à Edge Function.
- Qualquer planilha processada agora grava valores PT-BR canônicos diretamente.

## Etapa 4 — Simplificar RPCs e Frontend ✅

- RPCs `get_dre_sales_summary` e `get_annual_dre_summary` recriadas filtrando apenas `'Concluído'` e `'Cartão de Crédito'`.
- Mapeamentos no frontend (`SalesRecordsTab.tsx`) reduzidos para 4 entradas canônicas.

## Etapa 5 — Limpeza de Uploads de Estoque ✅

- 5 uploads antigos do Boulevard deletados (com `stock_records` e `stock_history` associados).
- Lógica automática adicionada em `process-spreadsheet`: após processar estoque, deleta uploads anteriores do mesmo PDV.
- Resultado: exatamente 1 upload de estoque por PDV.

## Etapa 6 — Reativar `ingest-revenue` ⏳

**Pendente.** A Edge Function `ingest-revenue` está desabilitada (503). Ao reativar:

1. Adicionar `normalizePaymentMethod()` e `normalizeStatus()` (mesmas funções da Etapa 3).
2. Aplicar normalização antes de inserir em `sales_records`.
3. Remover o bloqueio 503.
4. Testar com payload real de cada PDV.

---

## Valores Canônicos PT-BR

| Campo | Valores aceitos |
|-------|----------------|
| `status` | `Concluído`, `Cancelado`, `Pendente`, `Reembolsado` |
| `payment_method` | `Cartão de Crédito`, `Cartão de Débito`, `PIX`, `Cortesia`, `Cupom`, `Não informado` |

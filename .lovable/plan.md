

## Auditoria da Implementação de Pré-Estoque — Inconsistências Encontradas

### Dados Atuais (Validados)

Os 2 registros Motorola foram corretamente deduzidos e alocados ao Tietê Plaza Shopping. Os 3 registros iPhone antigos foram removidos (pela limpeza anterior). FKs `pre_stock_pdv_id_fkey` e `pre_stock_allocated_pdv_id_fkey` estão corretas. Nenhum `stock_history` órfão encontrado.

---

### Bug 1: Valor "none" enviado como UUID (CRÍTICO)

**Arquivo**: `src/components/upload/PreStockForm.tsx` (linha 127, 154)

No `Select` de PDV, a opção "Sem PDV específico" tem `value="none"`. Quando selecionada, `pdvId` = `"none"`. No submit, `pdvId || null` avalia `"none"` como truthy e envia a string `"none"` como `pdv_id` — causando erro de FK/UUID no banco.

**Correção**: Trocar `value="none"` para `value=""` ou tratar `pdvId === "none"` como null no submit.

---

### Bug 2: `allocated_pdv_id` gravado em deduções parciais (SEMÂNTICO)

**Arquivos**: `process-spreadsheet/index.ts` (linha 1027), `ingest-stock/index.ts` (linha 299)

Quando um registro de pré-estoque é parcialmente deduzido (ex: 14 comprados, 7 alocados, 7 restantes), o código seta `allocated_pdv_id` e mantém `status: "pending"`. Isso é semanticamente incorreto — o PDV de destino só deveria ser registrado quando totalmente alocado, ou deveria haver um histórico de alocações parciais.

Pior: se outro PDV depois consome os 7 restantes, `allocated_pdv_id` é sobrescrito, perdendo o registro do primeiro PDV.

**Correção**: Só setar `allocated_pdv_id` quando `newRemaining <= 0` (totalmente alocado). Para rastreio de múltiplos PDVs parciais, seria necessária uma tabela de log separada (escopo futuro).

---

### Bug 3: Fetch duplicado de `organization_id` na `process-spreadsheet`

**Arquivo**: `process-spreadsheet/index.ts` (linhas 939-943 e 991)

O `organization_id` é buscado duas vezes na mesma execução: uma para gerar `stock_history` e outra para a dedução de pré-estoque. Desperdício de query.

**Correção**: Reutilizar o resultado da primeira query.

---

### Bug 4: Limpeza de uploads antigos deleta `stock_history` por `upload_id` (RISCO)

**Arquivo**: `process-spreadsheet/index.ts` (linhas 1061-1065)

A rotina de limpeza deleta `stock_history` vinculado a uploads antigos. Mas se o upsert de snapshot (linha 974-979) atualizou o `upload_id` do registro existente para o upload atual, os registros antigos já não existem com o `upload_id` velho. Isso funciona hoje por coincidência, mas se dois uploads do mesmo PDV ocorrerem em dias diferentes, os snapshots de dias anteriores seriam apagados incorretamente.

**Correção**: Não deletar `stock_history` por `upload_id` na rotina de limpeza. Os snapshots são independentes — só deletar `stock_records` e `uploads` antigos.

---

### Resumo de Ações

| # | Severidade | Descrição | Arquivo |
|---|-----------|-----------|---------|
| 1 | CRÍTICO | `"none"` enviado como UUID no pdv_id | `PreStockForm.tsx` |
| 2 | MÉDIO | `allocated_pdv_id` setado em deduções parciais | Ambas edge functions |
| 3 | BAIXO | Fetch duplicado de org_id | `process-spreadsheet/index.ts` |
| 4 | MÉDIO | Limpeza deleta stock_history de dias anteriores | `process-spreadsheet/index.ts` |


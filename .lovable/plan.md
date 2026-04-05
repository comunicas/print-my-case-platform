

## Etapa 3 — Normalizar `process-spreadsheet` para PT-BR Canônico

### Problema

A Edge Function `process-spreadsheet` grava `payment_method` e `status` exatamente como vêm da planilha (ex: `creditCard`, `Completed`). Isso polui o banco com variantes que as RPCs e o frontend precisam mapear.

### Solução

Adicionar duas funções de normalização na Edge Function e aplicá-las no `mapSalesRow`:

**1. `normalizePaymentMethod(raw)`**

```text
creditCard / credit_card       → Cartão de Crédito
debitCard / debit_card         → Cartão de Débito
pix / PIX                     → PIX
machineFree / Cortesia         → Cortesia
couponFree / Cupom             → Cupom
null / vazio                   → Não informado
```

**2. `normalizeStatus(raw)`**

```text
Completed / Pago              → Concluído
Cancelled / Canceled          → Cancelado
Pending                       → Pendente
Refunded                      → Reembolsado
```

### Alteração no arquivo

**`supabase/functions/process-spreadsheet/index.ts`**

- Adicionar funções `normalizePaymentMethod()` e `normalizeStatus()` (case-insensitive lookup em um mapa estático).
- No `mapSalesRow`, substituir as linhas 393-397:
  - `case "payment_method"`: chamar `normalizePaymentMethod(value)` em vez de `sanitizeString(value)`.
  - `case "status"`: chamar `normalizeStatus(value)` em vez de `sanitizeString(value)`.
- Atualizar `REFUND_STATUS_KEYWORDS` para incluir `"Reembolsado"` (valor normalizado).
- Deploy automático da Edge Function.

### Resultado

Qualquer planilha processada a partir de agora gravará valores PT-BR canônicos diretamente, eliminando a necessidade de normalização posterior no banco.


## Contexto da validação

A imagem de referência (dashboard do gateway) mostra para 08/05 um total de **7 vendas pagas**: Boulevard Tatuapé 3, Extra Ricardo Jafet 2, Tietê Plaza 2.

Após a sincronização atual via API, o banco tem **11 registros** marcados como "Concluído" para o mesmo dia/PDVs. A diferença vem exatamente de 4 registros sem método de pagamento (`Não informado`) e valor 0,00 — pedidos que no gateway não estão pagos (provavelmente pendentes/expirados/abandonados), mas que estamos gravando como Concluído.

### Causa raiz

Em `supabase/functions/ingest-revenue/index.ts`:

```ts
function normalizeStatus(v: unknown): string {
  if (v === null || v === undefined || String(v).trim() === "") return "Concluído"; // ❌
  ...
  return STATUS_MAP[k] ?? sanitize(...) ?? "Concluído"; // ❌ fallback errado
}
```

Qualquer status ausente, desconhecido ou não-mapeado é forçado para `"Concluído"`. Isso quebra a regra global do projeto (agregados financeiros/vendas só podem incluir `Concluído` / `Pago` reais) e infla as métricas.

## Plano

### 1. Corrigir `normalizeStatus` (única alteração funcional)

- Remover o fallback "Concluído" para valores vazios/desconhecidos.
- Default seguro passa a ser `"Pendente"` (regra canônica do projeto).
- Ampliar `STATUS_MAP` para mapear explicitamente os status crus que o Kexiaozhan/gateway envia para pedidos não-pagos (`pending`, `unpaid`, `awaiting_payment`, `expired`, `cancelled`, `refunded`, `failed`, `rejected`, `void`, etc.) para os canônicos `Pendente`, `Cancelado`, `Reembolsado`.

### 2. Heurística complementar de segurança

Aplicar **somente quando o gateway não trouxer status confiável**: se `status` resultou em `Pendente` por default **e** `payment_method = "Não informado"` **e** `amount = 0` **e** `actual_paid_amount` nulo/0 → manter como `Pendente` (não tentar "adivinhar" Concluído). Não vamos descartar o registro: ele continua existindo na base, apenas não entra nos agregados de vendas pagas (regra que já está em vigor no projeto).

### 3. Saneamento dos dados já gravados

Migration única para reclassificar os registros `source='api'` históricos que casam com o padrão de não-pago:

```sql
UPDATE public.sales_records
SET status = 'Pendente'
WHERE source = 'api'
  AND status = 'Concluído'
  AND payment_method = 'Não informado'
  AND COALESCE(amount, 0) = 0
  AND COALESCE(actual_paid_amount, 0) = 0;
```

Isso ajusta o histórico sem apagar registros, preservando rastreabilidade.

### 4. Telemetria de sync

Em `sync_summary` adicionar contagem de `non_paid_filtered` (registros que entraram como Pendente por essa heurística) para facilitar auditorias futuras.

### 5. Validação pós-deploy

- Re-rodar a sync de Maio.
- Conferir contagem de Concluído por PDV em 08/05 SP → esperado: Boulevard 3, Extra 2, Tietê 2 (total 7).
- Conferir mês inteiro contra a tela "This Month" da imagem de referência (Boulevard 19, Extra 14, Tietê 27).

## Arquivos afetados

- `supabase/functions/ingest-revenue/index.ts` — ajustes em `STATUS_MAP`, `normalizeStatus` e `sync_summary`.
- Nova migration de saneamento dos dados API existentes.

## Fora de escopo

- UI (a página de upload e dashboard já consomem os campos canônicos corretamente).
- Lógica de mês/timezone e dedup cross-source (já corrigidas anteriormente).



## Correção: Erro "pdvData is not defined" no processamento de estoque

### Causa Raiz

Na linha 943, `pdvData` é declarado com `const` dentro de um bloco `if (recordsInserted > 0)`:

```typescript
// Linha 943 — dentro de um bloco if
const { data: pdvData } = await supabase
  .from("pdvs")
  .select("organization_id")
  .eq("id", pdvId)
  .single();
```

Na linha 993, `pdvData` é referenciado novamente num bloco irmão:

```typescript
// Linha 993 — bloco separado, pdvData não existe aqui
if (recordsInserted > 0 && pdvData?.organization_id) {
```

Como `pdvData` foi declarado com `const` dentro do `if` da linha 941, ele não existe no escopo da linha 993. Resultado: `ReferenceError: pdvData is not defined`.

### Correção

Mover a consulta de `pdvData` para **antes** dos dois blocos que precisam dele, logo após a inserção dos stock records (antes da linha 941). Ambos os blocos (stock_history snapshot e pré-estoque) usarão a mesma variável.

**`supabase/functions/process-spreadsheet/index.ts`**

1. Após a linha 938 (fim do batch insert de stock), adicionar a consulta de `pdvData` no escopo do bloco `stock`:

```typescript
// Fetch organization_id once for both stock_history and pre_stock
const { data: pdvData } = await supabase
  .from("pdvs")
  .select("organization_id")
  .eq("id", pdvId)
  .single();
```

2. Remover a declaração duplicada de `pdvData` que está dentro do bloco `if (recordsInserted > 0)` na linha 943.

3. Manter a condição `if (recordsInserted > 0)` para os dois blocos que usam `pdvData`, mas agora ambos terão acesso à variável.

### Resultado
- Uploads de estoque voltam a funcionar sem erro
- Deduplicação de pré-estoque funciona corretamente
- Histórico de estoque continua sendo gerado


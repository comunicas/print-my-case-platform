

## Correção da Ingestão de Vendas via API (`ingest-revenue`)

### Problemas Encontrados

Os dados vindos da **API** (source = `api`, 135 registros) estão com problemas graves. As planilhas (source = `spreadsheet`, 1209 registros) estão corretas.

| Problema | Dados no banco | Esperado |
|----------|---------------|----------|
| `payment_method` numérico | `0`, `5`, `7`, `4` | `creditCard`, `pix`, etc. |
| `status` numérico | `6` | `Concluído`, `Cancelado`, etc. |
| `payment_date` NULL | 69 registros sem data | Data válida |

A máquina está enviando **códigos numéricos** para `payment_method` e `status`, e a edge function `ingest-revenue` aceita sem mapear.

**Distribuição dos códigos API:**

| payment_method | status | Qtd | Provável significado |
|---|---|---|---|
| `0` | Concluído | 62 | 0 = creditCard (padrão) |
| `7` | Cancelado | 57 | 7 = código de cancelamento |
| `5` | Concluído | 10 | 5 = outro método (pix?) |
| `0` | `6` | 1 | status 6 = desconhecido |

### Plano de Correção

**1. `supabase/functions/ingest-revenue/index.ts`** — Adicionar mapeamento de códigos numéricos

```typescript
// Mapear payment_method numérico para texto
function normalizePaymentMethod(value: unknown): string | null {
  const str = String(value ?? '').trim();
  const methodMap: Record<string, string> = {
    '0': 'creditCard',
    '4': 'debitCard',
    '5': 'pix',
    '7': 'creditCard', // cancelados também vêm com 7
  };
  return methodMap[str] || sanitizeString(value, 50);
}

// Mapear status numérico para texto
function normalizeStatus(value: unknown): string | null {
  const str = String(value ?? '').trim();
  const statusMap: Record<string, string> = {
    '6': 'Pendente',
  };
  return statusMap[str] || sanitizeString(value, 50);
}
```

- Usar `normalizePaymentMethod()` e `normalizeStatus()` ao construir o record (linhas 211-212)
- Validar que `payment_date` usa fallback para `new Date().toISOString()` quando NULL (já faz, mas o campo está sendo setado como `null` explicitamente na linha 209 — remover a condição que permite null)

**2. Migration SQL** — Corrigir dados existentes no banco

```sql
-- Corrigir payment_method numéricos
UPDATE sales_records SET payment_method = 'creditCard' WHERE payment_method = '0' AND source = 'api';
UPDATE sales_records SET payment_method = 'pix' WHERE payment_method = '5' AND source = 'api';
UPDATE sales_records SET payment_method = 'creditCard' WHERE payment_method = '7' AND source = 'api';
UPDATE sales_records SET payment_method = 'debitCard' WHERE payment_method = '4' AND source = 'api';

-- Corrigir status numérico
UPDATE sales_records SET status = 'Pendente' WHERE status = '6' AND source = 'api';

-- Corrigir payment_date NULL (usar now() como fallback)
UPDATE sales_records SET payment_date = now() WHERE payment_date IS NULL;
```

### Questão importante

Os mapeamentos numéricos (0=creditCard, 5=pix, 7=creditCard) são **suposições** baseadas na correlação com status. Se você tiver documentação da máquina com os códigos reais, os mapeamentos podem ser ajustados.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ingest-revenue/index.ts` | Normalizar `payment_method` e `status` numéricos, forçar `payment_date` não-null |
| Migration SQL | Corrigir 135 registros existentes com dados numéricos/null |


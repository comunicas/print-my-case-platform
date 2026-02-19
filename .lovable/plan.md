
# Diagnóstico de Dados Duplicados e Melhoria dos Filtros de Data

## Parte 1 — Dados Duplicados: Diagnóstico Completo

### O que foi encontrado

**12 grupos de duplicatas** no banco, totalizando **12 registros extras** (cada grupo tem exatamente 2 ocorrências). Distribuição:

| Característica | Detalhe |
|---|---|
| Origem | 100% dos duplicados têm `source = 'api'` e `upload_id = NULL` |
| Causa raiz | A edge function `ingest-revenue` não verifica duplicatas antes de inserir |
| Impacto financeiro | Registros duplicados inflam as métricas do dashboard |
| Status dos duplicados | 8 são "Cancelado" (fora do cálculo de receita), 4 são "Concluído" (contam dobrado) |

### Causa Raiz: `ingest-revenue/index.ts`

A edge function que recebe dados via API **não verifica se o par `order_number + pdv_id` já existe** antes de inserir. O código atual faz diretamente:

```typescript
// PROBLEMA: sem verificação de duplicata
const { data: inserted, error: insertError } = await supabase
  .from("sales_records")
  .insert(record)
  .select("id")
  .single();
```

### Solução para os dados existentes

Antes de implementar a correção na edge function, é necessário limpar os 12 registros duplicados existentes. A limpeza é feita mantendo apenas o registro mais antigo (menor `id`) de cada par duplicado.

### Solução para novos dados (edge function)

Adicionar a estratégia `upsert` com `onConflict: 'order_number,pdv_id'` — ou uma verificação prévia `SELECT` antes do `INSERT`. A abordagem mais segura é verificar e retornar o registro existente com status `200` em vez de inserir e retornar `201`.

Para que o `upsert` funcione, é necessário também criar uma **constraint única no banco** em `sales_records(order_number, pdv_id)` para registros com `source = 'api'`.

---

## Parte 2 — Melhoria dos Filtros de Data

### Estado atual

O `DateRangeFilter` em `src/components/dashboard/DateRangeFilter.tsx` tem apenas 4 presets limitados: `Hoje`, `7d`, `30d`, `90d`. Faltam presets importantes como:
- **Este mês** (do dia 1 até hoje)
- **Mês passado** (mês completo anterior)
- **Período personalizado com anos** — atualmente o calendário não exibe o seletor de mês/ano, obrigando o usuário a navegar mês a mês clicando nas setas

Além disso, o `DateRangeFilter` usado no dashboard **não passa o `dataRange`** (mínimo e máximo dos dados reais), então o botão "Ver tudo" nunca aparece.

### Melhorias planejadas

1. **Novos presets de período**: Adicionar `Este mês` e `Mês passado` ao lado dos presets existentes — alinhado com `datePresets` de `date-presets.ts` que já os define mas não os usa
2. **Calendário com navegação por mês/ano**: Configurar o `Calendar` com a prop `captionLayout="dropdown-buttons"` para mostrar dropdowns de mês e ano
3. **Exibição da data com ano quando necessário**: Quando o período selecionado inclui datas de anos diferentes do atual, mostrar o ano no display (ex: `22/01/2025 - 18/02/2026`)
4. **Fechar calendário com um clique**: Atualmente o calendário só fecha quando ambas as datas estão selecionadas. Quando o usuário seleciona apenas a data inicial, o calendário deve continuar aberto aguardando a data final — mas deve existir um botão "Fechar" caso o usuário queira cancelar
5. **Input manual de datas**: Adicionar campos de texto dentro do calendário para digitar as datas diretamente (`DD/MM/AAAA`)

---

## Arquivos a criar/modificar

| Arquivo | Ação | Descrição |
|---|---|---|
| `supabase/functions/ingest-revenue/index.ts` | EDITAR | Adicionar verificação de duplicata antes do insert: buscar por `order_number + pdv_id`, se existir retornar 200 com o registro existente em vez de inserir |
| `src/components/dashboard/DateRangeFilter.tsx` | EDITAR | Adicionar presets "Este mês" e "Mês passado", melhorar calendário com `captionLayout="dropdown-buttons"`, melhorar display de data com ano quando necessário |
| `src/lib/utils/date-presets.ts` | EDITAR | Adicionar `getDateRangeFromPeriod` para suporte a "lastMonth" que já existe em `datePresets` mas não em `getDateRangeFromPeriod` |
| Migration SQL | CRIAR | Adicionar constraint única em `sales_records(order_number, pdv_id)` apenas para `source = 'api'` + deletar os 12 registros duplicados existentes |

---

## Detalhe técnico: limpeza das duplicatas

A query para remover os duplicados mantendo apenas o registro mais antigo de cada grupo é:

```sql
-- Remove duplicatas mantendo o registro mais antigo (menor ctid)
DELETE FROM sales_records
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY order_number, pdv_id
        ORDER BY id  -- mantém o mais antigo
      ) as rn
    FROM sales_records
    WHERE source = 'api'
  ) ranked
  WHERE rn > 1
);
```

## Detalhe técnico: constraint única para prevenção futura

```sql
-- Unique constraint apenas para registros da API
CREATE UNIQUE INDEX IF NOT EXISTS sales_records_api_order_pdv_unique
ON sales_records (order_number, pdv_id)
WHERE source = 'api';
```

## Detalhe técnico: verificação de duplicata na edge function

```typescript
// Verificar se já existe antes de inserir
const { data: existing } = await supabase
  .from("sales_records")
  .select("id")
  .eq("order_number", record.order_number)
  .eq("pdv_id", record.pdv_id)
  .eq("source", "api")
  .maybeSingle();

if (existing) {
  // Retorna 200 com o registro existente — idempotente
  return new Response(
    JSON.stringify({ success: true, record_id: existing.id, pdv_id: pdv.id, duplicate: true }),
    { status: 200, ... }
  );
}

// Só insere se não existir
const { data: inserted, error: insertError } = await supabase
  .from("sales_records")
  .insert(record)
  .select("id")
  .single();
```

## Detalhe técnico: novos presets no DateRangeFilter

```typescript
const PRESETS = [
  { label: "Hoje",        getDates: () => ({ from: startOfDay(today), to: endOfDay(today) }) },
  { label: "7d",          getDates: () => ({ from: startOfDay(subDays(today, 6)), to: endOfDay(today) }) },
  { label: "30d",         getDates: () => ({ from: startOfDay(subDays(today, 29)), to: endOfDay(today) }) },
  { label: "90d",         getDates: () => ({ from: startOfDay(subDays(today, 89)), to: endOfDay(today) }) },
  { label: "Este mês",    getDates: () => ({ from: startOfMonth(today), to: endOfDay(today) }) },
  { label: "Mês passado", getDates: () => ({ from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) }) },
];
```

## Ordem de execução

1. Executar migration SQL (limpar duplicatas + criar constraint)
2. Atualizar `ingest-revenue` com verificação de duplicata
3. Melhorar `DateRangeFilter` com novos presets e calendário com dropdown de mês/ano
4. Atualizar `getDateRangeFromPeriod` em `date-presets.ts` para cobrir "lastMonth"

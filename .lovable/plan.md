

## Finalização v1 — Pré-Estoque (Compras)

### Itens identificados

| # | Tipo | Descrição |
|---|------|-----------|
| 1 | Bug residual | `PreStockForm.tsx` ainda usa `value="none"` no SelectItem (linha 158). O fix no submit trata `pdvId === "none"`, mas o ideal é usar `value=""` para consistência com o padrão de Select vazio |
| 2 | Indentação | `process-spreadsheet/index.ts` linhas 992-1036: bloco de dedução tem indentação inconsistente (mix de 12 e 14 espaços) |
| 3 | Legado | `.lovable/plan.md` contém o plano do último passo (KPI Cards). Deve ser atualizado com documentação final do módulo completo |
| 4 | KPI filtro | Os KPI cards calculam totais sobre `items` filtrados (por PDV/status/search). Quando o usuário filtra por "Alocado", o card "Pendentes" mostra 0. Isso pode confundir — os KPIs deveriam refletir o total geral, não os filtrados |

### Ações

#### 1. Fix SelectItem value (PreStockForm.tsx)
Trocar `<SelectItem value="none">` para `<SelectItem value="__none__">` e atualizar a checagem no submit. Alternativa: manter o fix atual (`pdvId !== "none"`) que já funciona — risco baixo.

**Decisão**: Manter como está. O fix no submit já cobre o caso. Complexidade zero.

#### 2. Corrigir indentação (process-spreadsheet)
Alinhar o bloco de dedução de pré-estoque para 10 espaços consistentes.

#### 3. Atualizar documentação (.lovable/plan.md)
Substituir o conteúdo com documentação completa do módulo de Pré-Estoque:
- Tabela `pre_stock` (schema, colunas, FKs)
- Fluxo de dedução automática (por diferença)
- Regras de alocação (allocated_pdv_id só em alocação total)
- KPIs e formulário
- Edge functions envolvidas

#### 4. KPIs com dados não-filtrados
Adicionar uma segunda query (ou reusar `items` sem filtro) para os KPIs mostrarem totais globais. Alternativa simples: buscar os totais separadamente com um `useQuery` dedicado.

**Abordagem escolhida**: Calcular KPIs a partir de uma query separada sem filtros no hook `usePreStock`, retornando `allItems` (ou `summary`) junto com `items`.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/process-spreadsheet/index.ts` | Corrigir indentação do bloco de dedução |
| `src/hooks/usePreStock.ts` | Adicionar query de summary (totais sem filtro) |
| `src/components/upload/PreStockTab.tsx` | Usar summary do hook para KPIs em vez de items filtrados |
| `.lovable/plan.md` | Documentação final do módulo |

### Resultado

- KPIs sempre mostram totais reais independente dos filtros
- Código limpo e consistente
- Documentação atualizada para referência futura


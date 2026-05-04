## Etapa 3 — Status: parcialmente concluída

As duas tools `get_pdv_metrics` e `get_sales_projection` **já existem** em `supabase/functions/ai-agent/tools.ts`:

- Foram adicionadas nas Etapas 1 e 2 (linhas 311–337 do array `TOOLS`).
- O mapeamento RPC já está em `TOOL_TO_RPC` (linhas 449–459) com exatamente os parâmetros pedidos:
  - `get_pdv_metrics` → `ai_get_pdv_metrics({ _days })`
  - `get_sales_projection` → `ai_get_sales_projection({ _target_net_per_pdv, _days_baseline })`

A única divergência em relação ao texto desta Etapa 3 é a **redação das `description`** (estão mais curtas que a spec).

## Mudança proposta

Atualizar APENAS as `description` das duas tools no array `TOOLS` para o texto exato fornecido na spec da Etapa 3, mantendo o resto (parameters, defaults, mapParams) intacto:

1. `get_pdv_metrics.description` → texto completo da spec ("Métricas consolidadas por PDV baseadas nos últimos N dias: ticket médio, vendas por dia, faturamento por dia, taxa de dedução histórica… Chamar este tool antes de get_sales_projection para ter o contexto completo.")
2. `get_sales_projection.description` → texto completo da spec (incluindo os exemplos de pergunta: "quanto preciso vender para lucrar R$X?", "vou bater a meta?", etc.)

## Detalhes técnicos

- Arquivo: `supabase/functions/ai-agent/tools.ts` (apenas substituição de strings nas linhas ~315 e ~328).
- Não mexer em `parameters`, `TOOL_TO_RPC`, nem em qualquer migration — já estão corretos.
- Após a edição, redeploy de `ai-agent` via `supabase--deploy_edge_functions` para que o modelo veja as descriptions atualizadas (descriptions afetam o tool routing do LLM).

## Por que isso importa

Descriptions mais ricas (com exemplos de perguntas e a dica "chamar get_pdv_metrics antes") melhoram o tool selection do modelo, especialmente para perguntas tipo "quanto preciso vender para lucrar R$5k?" — que é exatamente o caso que originou esta sequência de batches.

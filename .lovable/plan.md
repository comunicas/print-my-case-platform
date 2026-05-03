## Objetivo
Melhorar a orquestração do Assistente IA para consultas de texto livre, ensinando o modelo a mapear intenções → sequência de tools, cruzar resultados multi-tool e tratar corretamente colunas opcionais (ex.: "Valor acumulado" em top produtos).

## Arquivo único a editar
`supabase/functions/ai-agent/skill.ts` — apenas a constante `SKILL_CORE`. Nenhum outro arquivo é tocado. A edge function `ai-agent` será redeployada automaticamente.

## Mudança A — Substituir a seção "Quando o usuário for vago"
Remover o bloco atual (3 bullets triviais) e colocar no mesmo lugar a nova seção `## Mapeamento de intenções — consultas de texto livre`, com 5 subseções:
- Vendas e faturamento (resumo, top produtos, evolução mês a mês, DRE)
- Estoque e ruptura (overview, zerados, baixo estoque, comprar, transferir)
- Diagnósticas e comparativas (PDV pior, visão geral, ranking, hot+baixo)
- Planejamento (plano de compras, pendentes, redistribuição)
- Fallback para intenção indefinida (pedir esclarecimento, não chamar tools às cegas)

Texto literal conforme fornecido pelo usuário.

## Mudança B — Adicionar seção "Orquestração multi-tool"
Inserir nova seção `## Orquestração multi-tool` **após** `## Continuidade entre turnos` e **antes** de `## Formatos canônicos por tipo de resposta`. Conteúdo:
- Quando chamar múltiplas tools (encadeamento natural, máx. 3 em diagnósticos)
- Como cruzar resultados (seções distintas, tratar contradições, marcar produto top + alerta com ⚠️)
- Agregações a partir de `get_stock_overview` (agrupar por `pdv_name`, contar zerados/críticos)
- Regra de "Valor acumulado" em top produtos (só incluir se a tool retornar receita; senão `—`, nunca inventar)

Texto literal conforme fornecido.

## Mudança C — Atualizar exemplo de `get_top_products`
Dentro de `## Formatos canônicos por tipo de resposta`, substituir a subseção `### Top produtos` para:
- Documentar colunas base (# | Produto | Vendas (un)) + opcionais (Valor acumulado, % do total) condicionadas à disponibilidade do dado
- Mostrar dois exemplos: com receita e sem receita
- Manter a regra de proibição de colunas Slot/PDV/Disponível em

## Preservação
Todo o restante de `SKILL_CORE` permanece intacto: missão, regras inegociáveis, política de redistribuição, zerados/análise de reposição, tratamento de erros, continuidade, demais formatos canônicos, fluxos de QuickAction, formato de resposta, status canônicos.

## Validação manual após deploy
- "como está a operação?" → 3 seções (vendas, alertas, zerados)
- "qual PDV está pior?" → cruza `get_pdv_comparison` + `get_low_stock_alerts`
- "preciso comprar?" → `get_zero_stock_items` → `analyze_restock_targets`
- "top produtos" → tabela sem coluna "Valor acumulado" inventada (usa `—` se a tool não retornar receita)
- "Comparar PDVs" (QuickAction) → contagem de zerados/críticos consistente por PDV
- Pergunta totalmente fora do escopo → pede esclarecimento, não chama tool aleatória

## Objetivo
Tornar cada QuickAction do Assistente IA um workflow operacional completo: cada botão envia um prompt detalhado ao agente, e o system prompt ensina o modelo a executar a sequência correta de tools e produzir o formato exato.

## Etapa 1 — Atualizar prompts das QuickActions

**Arquivo:** `src/components/ai-agent/QuickActions.tsx` (não `AgentChatPanel.tsx` — o array `ACTIONS` vive aqui).

Substituir apenas o campo `prompt` de cada um dos 6 itens em `ACTIONS`, preservando `label`, `icon` e a ordem. Os 6 novos prompts (multi-linha) seguem exatamente o texto fornecido pelo usuário:

1. **Otimizar estoque entre PDVs** → sequência `get_zero_stock_items` → `get_stock_overview`, saída por PDV com tabela `Slot | Produto | Qtd atual | Disponível em`.
2. **Resumo dos últimos 30 dias** → `get_sales_summary` → `get_pdv_comparison` → `get_top_products(limit=10)`, 3 seções.
3. **Produtos em ruptura** → `get_low_stock_alerts(threshold=3)`, por PDV com Status (🔴/🟠/🟡).
4. **Top produtos vendidos** → `get_top_products(limit=15)` → `get_sales_summary`, tabela única com linha TOTAL.
5. **Comparar PDVs** → `get_pdv_comparison` → `get_stock_overview`, 2 seções + destaque final.
6. **DRE do mês** → `get_financial_summary`, tabela DRE + opcional por PDV.

Preservar `handleSend`, `onSelect`, `disabled={isSending}` (já vivem em `AgentChatPanel.tsx` e não mudam).

## Etapa 2 — Adicionar seção "Fluxos operacionais por QuickAction" em skill.ts

**Arquivo:** `supabase/functions/ai-agent/skill.ts`

Inserir uma nova seção `## Fluxos operacionais por QuickAction` na constante `SKILL_CORE`, posicionada **após** `## Formatos canônicos por tipo de resposta` e **antes** de `## Formato de resposta`.

Conteúdo da seção: 6 sub-blocos (`### Fluxo: ...`) — um por QuickAction — descrevendo:
- sequência obrigatória de tools
- headings e tabelas exatas (colunas, fallbacks)
- regras de cálculo (ex.: % do total, linha TOTAL, status por faixa de quantidade)

Texto literal conforme o prompt do usuário. Todo o restante de `SKILL_CORE` permanece intacto.

## Deploy
A edge function `ai-agent` será redeployada automaticamente após a alteração de `skill.ts`.

## Validação
- Clicar cada QuickAction e confirmar que o agente chama a sequência correta de tools e retorna o formato especificado (headings por PDV, colunas certas, sem mistura de tipos).
- Em "Top produtos vendidos", verificar a linha **TOTAL top 15** com soma de unidades, % e valor.
- Em "Produtos em ruptura", verificar emojis de status por faixa.

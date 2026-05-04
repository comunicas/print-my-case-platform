## ETAPA 2 — Adicionar fluxo "Briefing semanal" ao agente

### Objetivo
Permitir que o agente responda perguntas como "como foi a semana?" com um relatório executivo completo em 4 seções (vendas, PDVs, alertas, ritmo) + foco da semana, sem exigir múltiplas perguntas.

### Mudanças

**1. `supabase/functions/ai-agent/skill.ts`**
- Inserir uma nova subseção `### Briefing semanal` dentro de `## Fluxos operacionais por QuickAction`, logo após o bloco `### Diagnóstico completo de PDV` (após a linha 169, antes da seção `## Formatos canônicos`).
- Conteúdo idêntico ao especificado pelo usuário:
  - Triggers: "como foi a semana?", "briefing da semana", "resumo semanal", "o que aconteceu essa semana?", "relatório da semana".
  - Sequência obrigatória de 4 chamadas de tools (período = últimos 7 dias):
    1. `get_sales_summary(7d)` + `get_pdv_comparison(7d)`
    2. `get_sales_timeline(7d, granularity=day)`
    3. `get_zero_stock_items` + `get_low_stock_alerts`
    4. `get_sales_projection()`
  - Saída em 4 seções obrigatórias com emojis:
    - `### 📈 Semana em números` (tabela com comparação semana anterior, omitindo coluna se indisponível)
    - `### 🏪 Performance por PDV` (tabela: PDV | Faturamento | Transações | Ticket médio | Participação %)
    - `### ⚠️ Alertas operacionais` (zerados sem alternativa 🔴, críticos com alta saída 🟠, ou ✅ se nenhum)
    - `### 🎯 Ritmo do mês` (uma linha por PDV vs. meta, ou orientação se meta não definida)
  - Bloco final `**Foco desta semana:**` com 2-3 bullets de ação prioritária baseados estritamente nos dados retornados (não inventar).

**2. Sincronização do `system_prompt` no banco**
- Após editar `skill.ts`, o conteúdo precisa ser propagado para `ai_agent_config.system_prompt` (caso contrário o runtime continua usando a versão da Etapa 1).
- Criar migração SQL que faz `UPDATE public.ai_agent_config SET system_prompt = $prompt$...$prompt$` com o conteúdo novo completo do `SKILL_CORE`.
- Inserir registro em `ai_agent_config_history` para auditoria da mudança.

**3. Redeploy do edge function**
- Redeploy de `ai-agent` para garantir que a constante `SKILL_CORE` atualizada esteja em produção (o fallback usado quando o DB estiver indisponível também passa a refletir o briefing).

### Validação pós-implementação
- Confirmar via `read_query` que o `length(system_prompt)` cresceu em relação à versão da Etapa 1 e contém a string `Briefing semanal`.
- Testar no chat do agente: "como foi a semana?" → deve retornar as 4 seções na ordem especificada + bloco Foco.

### Fora de escopo
- Nenhuma mudança em `tools.ts` (todas as tools necessárias já existem desde o Nível 1).
- Nenhuma mudança em `index.ts`.

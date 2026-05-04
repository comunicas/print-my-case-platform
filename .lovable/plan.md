## Etapa 0 — Sincronizar `system_prompt` do banco com `skill.ts`

### Diagnóstico confirmado

Consultei a tabela `ai_agent_config` e confirmei o problema:

- **Banco** (`ai_agent_config.system_prompt`): 2.332 caracteres, começa com `<papel>Assistente de estoque do {empresa}…</papel>` — é uma versão **antiga** (placeholder genérico, em XML, sem nenhum dos formatos canônicos do Nível 1).
- **Código** (`supabase/functions/ai-agent/skill.ts` → `SKILL_CORE`): 205 linhas com toda a lógica das Etapas 1–4 (meta reversa, formatos canônicos, mapeamento de intenções de projeção, etc.).
- **`index.ts`** carrega o prompt do banco primeiro, então o `SKILL_CORE` do código é **ignorado em runtime**. Isso explica por que o agente continua usando o formato de estoque (`Slot | PDV | Produto | Qtd | Disponível em`) mesmo para perguntas de projeção.

### Mudança

Substituir o conteúdo de `ai_agent_config.system_prompt` pelo valor exato de `SKILL_CORE` (string atual de `supabase/functions/ai-agent/skill.ts`, sem as crases de template literal).

A escrita será via migration `UPDATE` (única linha singleton — `singleton = true`). A migration também registra o histórico em `ai_agent_config_history` (entity = `ai_agent_config`, changed_fields = `{system_prompt}`) para manter o rastro de alteração que o painel admin já usa.

```text
ai_agent_config.system_prompt  ← SKILL_CORE (≈205 linhas)
ai_agent_config.updated_at     ← now()
ai_agent_config_history        ← INSERT com payload do prompt antigo
```

### Validação após aplicar

1. `SELECT length(system_prompt) FROM ai_agent_config` deve retornar ~8–9 mil caracteres (e não 2.332).
2. No `/assistente`, perguntar **"quais os top produtos vendidos?"** → resposta deve usar `# | Produto | Vendas (un) | % do total | Valor acumulado` e **NÃO** `Slot | PDV | Produto | Qtd | Disponível em`.
3. Perguntar **"para lucrar R$5.000 líquido por PDV, quanto preciso vender?"** → resposta deve seguir o formato canônico de "Meta reversa" (3 blocos: Baseline · Projeção · Meta) com a fórmula `Meta bruta = (Meta líquida + Despesas) ÷ (1 − Taxa de dedução)` ao final.

### Detalhes técnicos

- **Arquivo de migration**: `supabase/migrations/<timestamp>_sync_ai_agent_system_prompt.sql`
- **Origem da string**: lida diretamente de `supabase/functions/ai-agent/skill.ts` (constante `SKILL_CORE`) e embutida na migration com dollar-quoting (`$prompt$ … $prompt$`) para preservar acentos, crases e quebras de linha.
- **Sem mudanças em código TS** — apenas dado. `index.ts`, `skill.ts` e `tools.ts` já estão corretos das etapas anteriores.
- **Sem deploy de edge function** necessário (o agent lê o prompt do banco a cada request, ou no próximo cache miss).

### Por que isso destrava o Nível 2

Sem a Etapa 0, qualquer adição que fizermos a `skill.ts` nas Etapas 1, 2 e 5 continuará invisível para o modelo. Esta migration é **pré-requisito obrigatório** das próximas etapas do Nível 2.

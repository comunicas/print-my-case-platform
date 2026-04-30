## Objetivo

Corrigir os problemas visuais reportados na página `/assistente` e revisar a responsividade em mobile, tablet e desktop, removendo elementos legados e duplicações.

## Problemas identificados

1. **Ícone duplicado no cabeçalho da página**: o `Sparkles` aparece tanto no título "Assistente IA" (`Assistente.tsx`) quanto no estado vazio do chat (`AgentChatPanel.tsx`), reforçando ruído visual.
2. **Histórico "quebrado" acima do chat (desktop/tablet)**: a `aside` lateral (`grid-cols-[240px_1fr]`) compartilha a mesma borda do painel do chat sem separação clara, e o botão grande "+ Nova conversa" no topo da lista cria a sensação de algo flutuando sobre o chat. Em telas largas a coluna ainda cresce demais e empurra a área de mensagens.
3. **Header mobile redundante**: existe um header próprio do chat em mobile (`flex md:hidden` com `Histórico` + `Nova`), mas o `AppHeader` global já tem o botão de menu. Em tablets em modo retrato (≥768px) o header mobile some, mas a sidebar lateral aparece ocupando 240px e estoura layouts apertados.
4. **Altura do painel**: `h-[calc(100svh-13rem)]` foi calculado para o layout antigo. Com o título compacto atual, sobra espaço em desktop e falta em telas baixas (notebooks 768px de altura), gerando rolagem dupla.
5. **Legados a remover**:
   - Subtítulo longo (`hidden sm:block`) que duplica a explicação do estado vazio.
   - `safe-area-inset-bottom` no `ChatInput` (classe inexistente no Tailwind config — vira no-op).
   - Botão "Nova" do header mobile com `sr-only sm:not-sr-only` (nunca aparece, pois o header só existe abaixo de `md`).
   - `h-11 w-11` no botão de envio versus `min-h-[44px]` no Textarea: alturas inconsistentes.

## Mudanças propostas

### `src/pages/Assistente.tsx`
- Remover o ícone `Sparkles` do título da página (manter apenas no estado vazio do chat).
- Esconder o subtítulo em telas `<md` (já é redundante com o empty state) e encurtá-lo em desktop.
- Reduzir o `space-y` para dar mais altura útil ao painel.

### `src/components/ai-agent/AgentChatPanel.tsx`
- Trocar o cálculo de altura para `h-[calc(100svh-var(--header)-var(--page-padding))]` aproximado: usar `h-[calc(100dvh-9rem)] md:h-[calc(100dvh-10rem)]` com `min-h-[420px]` e remover `max-h`.
- Ajustar grid para `md:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr]` (não cresce além de 300px).
- Adicionar `bg-muted/20` apenas na `aside` e manter o painel direito com `bg-card`, criando contraste e eliminando a sensação de "flutuação".
- Simplificar o header mobile: somente botão `Histórico` à esquerda, título centralizado curto (sem truncar agressivamente) e botão "Nova" como `icon-only` (44×44). Remover `sr-only sm:not-sr-only`.
- Garantir `position: relative` no container e `z-0` no painel; `Sheet` continua usando o portal padrão (z-50), eliminando qualquer conflito de z-index.
- Remover `min-h-0` redundantes onde não há flex-child com overflow.

### `src/components/ai-agent/ConversationList.tsx`
- Substituir o botão grande "+ Nova conversa" do topo por um cabeçalho enxuto: rótulo "Conversas" à esquerda + botão `Plus` icon-only à direita (44×44, `variant="ghost"`).
- Reduzir padding interno para `p-2` e usar tipografia `text-[13px]` nos itens.
- Manter agrupamento por data (Hoje/Ontem/etc.).

### `src/components/ai-agent/ChatInput.tsx`
- Remover a classe inexistente `safe-area-inset-bottom`; usar `pb-[max(0.5rem,env(safe-area-inset-bottom))]` via `style` inline ou utilitário existente.
- Padronizar botão de envio em `h-11 w-11` e Textarea com `min-h-[44px]` (já consistente, apenas confirmar).
- Manter regra Enter (desktop envia, mobile quebra linha).

### `src/components/ai-agent/MessageBubble.tsx`
- Sem mudanças estruturais; apenas garantir `max-w-[calc(100%-3rem)]` para acomodar o avatar 32px + gap.

### `src/components/ai-agent/QuickActions.tsx`
- Em telas `lg+`, usar `lg:grid-cols-3` para preencher melhor o espaço do empty state em desktop.

## Validação responsiva

Testar em:
- 375×812 (iPhone): header mobile do chat visível, Sheet abre histórico, sem overflow horizontal.
- 768×1024 (tablet retrato): sidebar do chat aparece em 260px, sem header mobile, mensagens com largura confortável.
- 1280×720 e 1484×954 (desktop atual do usuário): grid `[260px_1fr]`, sem espaço em branco excessivo, scroll único dentro do painel.
- 1920×1080: sidebar não passa de 300px, mensagens centralizadas em `max-w-3xl`.

## Detalhes técnicos

- Usar `100dvh` (dynamic viewport) ao invés de `100svh` em conjunto com `min-h` para evitar saltos quando a barra de URL do mobile aparece/some.
- Confirmar que `Sheet` do Radix renderiza em portal com z-50 — sem necessidade de ajustes de z-index no painel.
- Nenhuma mudança em edge functions, hooks ou lógica de envio.

## Arquivos afetados

- `src/pages/Assistente.tsx`
- `src/components/ai-agent/AgentChatPanel.tsx`
- `src/components/ai-agent/ConversationList.tsx`
- `src/components/ai-agent/ChatInput.tsx`
- `src/components/ai-agent/MessageBubble.tsx`
- `src/components/ai-agent/QuickActions.tsx`

Sem alterações de banco de dados, RLS ou edge functions.

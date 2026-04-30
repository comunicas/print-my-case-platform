## Escopo

Apenas front-end do `/assistente`. Sem backend, RPCs, edge functions ou hooks de dados.

## Mudanças

### 1. `src/components/layout/AppLayout.tsx`
Adicionar `min-h-0` ao wrapper `flex-1 flex flex-col` e ao `<main>`. Manter `overflow-auto` no `<main>` para rotas normais. Isso permite que páginas filhas usem `h-full` sem colapsar em flex columns.

### 2. `src/pages/Assistente.tsx`
- Wrapper passa a `flex-1 min-h-0 flex flex-col gap-2 sm:gap-3 h-full`.
- Bloco do título marcado como `shrink-0`.
- `<AgentChatPanel />` ocupa o restante (`flex-1 min-h-0`).

### 3. `src/components/ai-agent/AgentChatPanel.tsx`
- Remover `h-[calc(100dvh-9rem)] md:h-[calc(100dvh-10rem)] min-h-[420px]`.
- Root: `relative grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] flex-1 min-h-0 border rounded-lg overflow-hidden bg-card z-0`.
- Coluna de chat: `flex flex-col min-w-0 min-h-0`.
- Wrapper de mensagens: `flex-1 min-h-0 overflow-hidden` (sem `ref` aqui).
- Auto-scroll: `ref` no `ScrollArea`, busca `[data-radix-scroll-area-viewport]` e seta `scrollTop = scrollHeight`.
- Header mobile: remover `text-center` do título (vira `flex-1 min-w-0 text-sm font-medium truncate`); botão direito vira pill "Novo" (label visível em `min-[360px]:inline`, icon-only abaixo disso, sempre 44×44 e `aria-label="Nova conversa"`).
- `ChatInput` permanece `shrink-0` no fim da coluna.

### 4. `src/components/ai-agent/ConversationList.tsx`
- Header: ícone `MessageSquare` + texto "Conversas" à esquerda; botão **pill primário** "Novo" (`size="sm"`, `h-8`, ícone `Plus` + label) à direita.
- Lista: `p-2.5`, `space-y-0.5`.
- Item ativo: `bg-accent text-accent-foreground` + `border-l-2 border-primary`.
- Título do item: `text-[13px] font-medium truncate`.
- Botão excluir: `md:opacity-0 md:group-hover:opacity-100` (sempre visível em touch).
- Estado vazio: ícone + "Nenhuma conversa ainda" + texto curto orientando iniciar novo chat.

## Validação

Testar via preview em 375×812, 414×896, 768×1024, 1280×720, 1671×1080, 1920×1080:
- Apenas a lista de mensagens rola.
- Input sempre visível.
- Sem rolagem dupla nem espaço morto.
- Botão "Novo" óbvio no desktop e mobile.
- Sheet mobile fecha ao selecionar/criar conversa.

## Arquivos alterados

- `src/components/layout/AppLayout.tsx`
- `src/pages/Assistente.tsx`
- `src/components/ai-agent/AgentChatPanel.tsx`
- `src/components/ai-agent/ConversationList.tsx`

## Fora do escopo

Backend, edge functions, RPCs, RAG, streaming, tool calling, banco, hooks de envio/carregamento.
# Plano: Revisão, correção de bugs e limpeza de legado do `/assistente`

## Objetivo

Após várias iterações no Assistente IA, sobraram inconsistências, código morto e a documentação ficou desatualizada. Esta entrega faz uma passagem de revisão técnica, corrige bugs encontrados, remove legado e atualiza `docs/assistente-ia.md` para refletir o estado real.

## Bugs e inconsistências encontrados

1. **Loader da página `/assistente` quebra o layout fullHeight.** Em `src/pages/Assistente.tsx`, durante `isLoading` o componente renderiza `<div className="flex items-center justify-center h-64">` dentro de um `AppLayout fullHeight`. Como o `<main>` está em `overflow-hidden` + `flex-col`, o `h-64` fixo deixa um vazio no rodapé e nunca centraliza no espaço disponível. Deve usar `flex-1 min-h-0` para ocupar a área inteira.

2. **Double-render do header em `Assistente.tsx`.** A página tem um `<h1>Assistente IA</h1>` + parágrafo logo acima do `AgentChatPanel`, e o painel também já tem seu próprio header (com toggle de sidebar e título da conversa). Em desktop ficam dois "headers" empilhados, gastando altura útil do chat. Solução: remover o header da página e manter apenas o do painel (que já mostra o título da conversa ativa). O título "Assistente IA" não agrega — o item do menu lateral já indica a página.

3. **Mutation `rename` exportada mas nunca consumida.** `useAiConversations.rename` não é usado em nenhum componente (`ConversationList` só chama `onSelect` e `onDelete`). É código morto vindo de uma versão anterior. Remover do hook (mantém o arquivo enxuto e o bundle menor).

4. **`Loader2` importado e não usado** em `AgentChatPanel.tsx` agora que o estado de loading das mensagens é tratado dentro do `ScrollArea` — confirmar e remover imports não utilizados (`Loader2` está usado, mas vou auditar `Plus`, `PanelLeftOpen`, etc. e remover qualquer ícone órfão após a limpeza). Rodar verificação final.

5. **`border-r-0` redundante** quando `w-0` no `<aside>` colapsado: a borda só existe se houver largura, mas mantemos por segurança visual em transição. Manter, é intencional.

6. **`overflow-hidden` no `<aside>` corta tooltip/foco.** Hoje o aside usa `overflow-hidden` para esconder o conteúdo ao animar `w-0`. Como o conteúdo está envolto em `{!sidebarCollapsed && ...}`, o `overflow-hidden` é desnecessário e impede sombras/ring de foco em itens da lista quando o painel está aberto. Trocar por `overflow-visible` (mantendo a transição de width).

7. **Auto-scroll dispara em troca de conversa mesmo sem mensagens novas.** O `useEffect` depende de `[messages, isSending]`. Ao alternar entre conversas, o array `messages` muda de referência mesmo carregando do cache, gerando um `scrollTo` desnecessário com `behavior: "smooth"` que pisca. Adicionar guarda: só fazer smooth scroll se `messages.length` aumentou; usar `instant` ao trocar de conversa (resetar para o final imediatamente). Implementação: rastrear `prevConversationId` e `prevLength` via `useRef`.

8. **`activeTitle` não atualiza após criar conversa nova.** Quando o usuário envia a primeira mensagem (`activeId === null`), `send()` retorna o novo `conversationId` e seta `activeId`. Mas a lista `conversations` é atualizada via `invalidateQueries` assíncrono — por 200–500ms o título mostra "Conversa" em vez do título gerado pela edge function. Aceitável; não bloqueia. Documentar como limitação conhecida.

## Limpeza de legado

- Remover `rename` (mutation + export) de `useAiConversations.ts`.
- Remover header redundante (`<h1>Assistente IA</h1>` + parágrafo) de `pages/Assistente.tsx`.
- Trocar `overflow-hidden` por `overflow-visible` no `<aside>` desktop em `AgentChatPanel.tsx`.
- Auditar imports não usados em `AgentChatPanel.tsx` após as mudanças.
- Remover do `.lovable/plan.md` o conteúdo antigo (ou substituir pelo plano atual). Optar por **deletar** o arquivo: ele é um plano de iteração já concluído e não faz parte da documentação oficial do produto.

## Mudanças por arquivo

### `src/pages/Assistente.tsx`
- Loader: trocar `h-64` por `flex-1 min-h-0` para centralizar no viewport.
- Remover o `<div>` com `<h1>` e o parágrafo informativo. O `AgentChatPanel` ocupa 100% da área via `flex-1 min-h-0`.

```tsx
return (
  <AppLayout fullHeight>
    <AgentChatPanel />
  </AppLayout>
);
```

### `src/components/ai-agent/AgentChatPanel.tsx`
- `<aside>`: `overflow-hidden` → `overflow-visible`.
- Auto-scroll: usar `useRef` para `prevConvIdRef` e `prevLenRef`. Se `prevConvIdRef.current !== activeId` → scroll instantâneo; se `messages.length > prevLenRef.current` → smooth; caso contrário, não rolar.
- Limpar imports órfãos (verificar após as edições).

### `src/hooks/useAiConversations.ts`
- Remover toda a `rename` mutation e seu export. Manter apenas `conversations`, `isLoading`, `remove`.

### `.lovable/plan.md`
- Deletar arquivo (plano de iteração concluído).

### `docs/assistente-ia.md`
Atualizar para refletir o estado real da UI e do front:

- Adicionar seção **"UI / UX"** descrevendo:
  - Layout de duas colunas em md+ (`280px` / `xl:320px`) com botão de colapsar persistido em `localStorage` (`ai-agent.sidebar-collapsed`).
  - Em mobile (<768px), histórico é acessado via `Sheet` lateral.
  - `ChatInput` fixo no rodapé (page com `AppLayout fullHeight`).
  - Exclusão de conversa via `AlertDialog` na lista.
  - Auto-scroll: smooth ao receber novas mensagens, instantâneo ao trocar de conversa.
- Adicionar seção **"Componentes do front"** listando:
  - `pages/Assistente.tsx` — guard de role + `AppLayout fullHeight`.
  - `components/ai-agent/AgentChatPanel.tsx` — orquestração.
  - `components/ai-agent/ConversationList.tsx` — histórico + exclusão.
  - `components/ai-agent/ChatInput.tsx`, `MessageBubble.tsx`, `QuickActions.tsx`.
  - Hooks: `useAiConversations`, `useAiMessages`, `useAiChat`.
- Atualizar **Checklist de deploy** com itens de UI já entregues.
- Adicionar **Limitações conhecidas**:
  - Título da conversa nova só aparece após o `invalidateQueries` resolver (~300ms).
  - Sem renomeação de conversa pela UI (mutation foi removida; reintroduzir quando houver tela).
- Limpar artefatos antigos do trecho ASCII da arquitetura (linha com indentação inconsistente).

## Fora de escopo

- Edge functions (`supabase/functions/ai-agent/*`), RPCs, RAG.
- Mudanças em `AppLayout`, `AppHeader`, `AppSidebar`.
- Renomeação de conversas pela UI (não há demanda imediata).

## Critérios de aceite

- `/assistente` renderiza sem header duplicado; chat ocupa toda a altura útil.
- Loader inicial fica centralizado verticalmente no espaço da página.
- Trocar de conversa não causa flicker de scroll suave.
- `useAiConversations` não exporta `rename`; nenhum import quebrado em todo o projeto.
- `docs/assistente-ia.md` reflete o front atual (UI, componentes, limitações).
- `.lovable/plan.md` removido.
- Nenhum import não usado em `AgentChatPanel.tsx`.

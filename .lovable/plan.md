## Bug
`AgentChatPanel.tsx` mantém `activeId` obsoleto vindo do `localStorage` quando a lista de conversas está vazia (ex.: após logout/login, enquanto `profile` ainda não carregou e `useAiConversations` está desabilitado). Isso faz o frontend enviar `conversationId` inválido para a Edge Function `ai-agent`, retornando 404 mascarado como "Edge Function returned a non-2xx status code".

## Causa
O `useEffect` de limpeza tem a guarda `conversations.length > 0`, que nunca é satisfeita quando a query está desabilitada (`conversations = []`, `convLoading = false`).

## Mudança (1 arquivo)

**`src/components/ai-agent/AgentChatPanel.tsx`** — remover a guarda `conversations.length > 0` e também limpar o `localStorage` ao detectar ID obsoleto:

```ts
useEffect(() => {
  if (!activeId || convLoading) return;
  // Limpa ID obsoleto mesmo quando a lista está vazia (ex.: profile ainda não
  // carregou e useAiConversations está desabilitado).
  if (!conversations.some((c) => c.id === activeId)) {
    setActiveId(null);
    localStorage.removeItem(ACTIVE_CONV_KEY);
  }
}, [activeId, conversations, convLoading]);
```

Restante do componente preservado (inicialização via `useState`, persistência no `setActiveId`, reset existente).

## Resultado esperado
- Após logout/login ou troca de organização, o painel inicia em "Nova conversa".
- Nenhuma mensagem é enviada com `conversationId` inválido → fim do 404 mascarado.
- Sem regressão na persistência da conversa ativa entre reloads do mesmo usuário (o ID só é limpo quando comprovadamente não pertence à lista atual e a query já resolveu).

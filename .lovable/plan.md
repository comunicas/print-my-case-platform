# Plano: Layout Responsivo Definitivo do `/assistente`

## Objetivo

Garantir que em `/assistente`:

1. Em md+ (≥768px) o **histórico** e o **chat** fiquem sempre lado a lado, nunca empilhados.
2. O painel de histórico tenha largura controlada (`280px` / `xl:320px`), com botão para **minimizar/expandir**.
3. O **campo de envio (ChatInput)** fique **fixo no rodapé** do painel em qualquer dispositivo, sem rolar com as mensagens.
4. Apenas a área de mensagens role; sem scroll duplicado e sem stacking vertical em nenhum breakpoint.

## Diagnóstico Atual

Estado de `AgentChatPanel.tsx` após últimas mudanças:

- Root usa `flex flex-1 min-h-0`, com `<aside class="hidden md:flex shrink-0 w-[280px] xl:w-[320px]">` e chat em `flex-1`.
- Input já está fora da área de scroll (logo após `<ScrollArea>`), portanto fixo ao rodapé do painel.
- Falta: botão para minimizar a sidebar em desktop, persistência opcional do estado, e validação visual em todos os breakpoints (375, 768, 1024, 1336, 1920).

A queixa de “empilhar” veio do estado anterior (`grid` falhando). O `flex` atual já resolve, mas não temos garantia visual via teste responsivo, nem botão de colapsar.

## Mudanças

### 1. `AgentChatPanel.tsx` — colapsar sidebar + reforçar layout

- Adicionar estado `sidebarCollapsed` (default `false`), persistido em `localStorage` com a chave `ai-agent.sidebar-collapsed`.
- Sidebar desktop:
  - `hidden md:flex shrink-0 border-r bg-muted/20 overflow-hidden transition-[width] duration-200`
  - largura dinâmica: `w-0` quando colapsada, `w-[280px] xl:w-[320px]` quando aberta.
  - quando colapsada, esconder o conteúdo (`hidden`) para evitar foco em itens invisíveis.
- Adicionar botão de toggle no header do chat (desktop apenas, `hidden md:inline-flex`):
  - ícone `PanelLeft` (aberto) / `PanelLeftOpen` (colapsado), `h-9 w-9`, `aria-label="Mostrar/Ocultar histórico"`, `title` correspondente.
- Criar header desktop fino acima da área de mensagens contendo:
  - botão de toggle à esquerda;
  - título da conversa ativa (`activeTitle`) truncado;
  - botão `Novo` (mesmo do mobile) à direita, mas só visível quando a sidebar está **colapsada** (caso contrário o `Novo` da `ConversationList` já cobre).
- Manter `flex-1 min-h-0` em todos os wrappers para o input continuar fixo no rodapé.
- Garantir que `ChatInput` permaneça **fora** do `<ScrollArea>` (já está) e adicionar `shrink-0` na div pai dele para reforçar.

### 2. `ConversationList.tsx` — pequeno ajuste

- Sem mudanças estruturais. Apenas garantir `min-w-0` no header para o título “CONVERSAS” não forçar overflow quando a sidebar estiver em `w-[280px]` (já presente).

### 3. Validação visual responsiva (QA)

Após a edição, executar via `browser--set_viewport_size` + `browser--screenshot` em:

- 375×812 (mobile): sidebar deve estar oculta, header com `PanelLeft` (Sheet) + título + `Novo`.
- 768×1024 (tablet): sidebar visível à esquerda (`280px`), chat à direita, lado a lado.
- 1024×768: idem 768.
- 1336×853 (viewport atual do usuário): sidebar `280px`, chat ocupando o restante.
- 1920×1080 (xl): sidebar `320px`.
- Em desktop: clicar no botão de colapsar e tirar screenshot confirmando que a sidebar some e o chat ocupa 100%.
- Verificar em todos: input visível e fixo no rodapé, sem scroll na página, apenas scroll dentro da lista de mensagens.

## Detalhes Técnicos

```tsx
// AgentChatPanel.tsx (trecho)
const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ai-agent.sidebar-collapsed") === "1";
});

useEffect(() => {
  localStorage.setItem("ai-agent.sidebar-collapsed", sidebarCollapsed ? "1" : "0");
}, [sidebarCollapsed]);

// Sidebar desktop
<aside
  className={cn(
    "hidden md:flex shrink-0 border-r bg-muted/20 overflow-hidden transition-[width] duration-200",
    sidebarCollapsed ? "w-0" : "w-[280px] xl:w-[320px]",
  )}
  aria-hidden={sidebarCollapsed}
>
  {!sidebarCollapsed && (
    <ConversationList ... />
  )}
</aside>

// Header desktop (acima do ScrollArea)
<div className="hidden md:flex items-center gap-2 px-3 py-2 border-b bg-background shrink-0">
  <Button
    variant="ghost"
    size="icon"
    className="h-9 w-9"
    onClick={() => setSidebarCollapsed((v) => !v)}
    aria-label={sidebarCollapsed ? "Mostrar histórico" : "Ocultar histórico"}
    title={sidebarCollapsed ? "Mostrar histórico" : "Ocultar histórico"}
  >
    {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
  </Button>
  <p className="flex-1 min-w-0 text-sm font-medium truncate">{activeTitle}</p>
  {sidebarCollapsed && (
    <Button size="sm" className="h-9 gap-1.5" onClick={() => handleSelect(null)}>
      <Plus className="h-4 w-4" />Novo
    </Button>
  )}
</div>
```

Estrutura final do painel:

```text
┌──────────────────────────────────────────────────────┐
│ AgentChatPanel (flex flex-1 min-h-0)                 │
│ ┌────────────┬─────────────────────────────────────┐ │
│ │ aside      │ flex-col flex-1 min-h-0             │ │
│ │ 280/320px  │  header (mobile OU desktop)         │ │
│ │ collapsible│  ScrollArea flex-1 min-h-0          │ │
│ │            │  ChatInput  (shrink-0, fixo rodapé) │ │
│ └────────────┴─────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Arquivos Alterados

- `src/components/ai-agent/AgentChatPanel.tsx`

## Fora de Escopo

- Backend, Edge Functions, RPCs, RAG, hooks de envio.
- `Assistente.tsx`, `AppLayout.tsx`, `ConversationList.tsx` (mantidos como estão).

## Critérios de Aceite

- Em todos os viewports listados, sidebar e chat aparecem lado a lado em md+ (nunca empilham).
- Sidebar respeita `280px` / `xl:320px` e nunca expande para 100%.
- Botão de minimizar funciona em desktop, com estado persistido entre recarregamentos.
- ChatInput fica fixo no rodapé do painel em mobile, tablet e desktop, sem scroll da página.
- Apenas a lista de mensagens rola; auto-scroll continua funcionando.

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, PanelLeft, PanelLeftOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAiConversations } from "@/hooks/useAiConversations";
import { useAiMessages } from "@/hooks/useAiMessages";
import { useAiChat } from "@/hooks/useAiChat";
import { ConversationList } from "./ConversationList";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";

const ACTIVE_CONV_KEY = "ai_current_conversation_id";

export function AgentChatPanel() {
  const { conversations, isLoading: convLoading, remove } = useAiConversations();
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_CONV_KEY);
  });
  const { data: messages = [], isLoading: msgsLoading } = useAiMessages(activeId);
  const { send, isSending } = useAiChat();
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ai-agent.sidebar-collapsed") === "1";
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<string | null>(activeId);
  const prevLenRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai-agent.sidebar-collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  // Persiste a conversa ativa entre reloads
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeId) localStorage.setItem(ACTIVE_CONV_KEY, activeId);
    else localStorage.removeItem(ACTIVE_CONV_KEY);
  }, [activeId]);

  // Se a conversa salva não existe mais (foi excluída), limpa
  useEffect(() => {
    if (!activeId || convLoading) return;
    if (conversations.length > 0 && !conversations.some((c) => c.id === activeId)) {
      setActiveId(null);
    }
  }, [activeId, conversations, convLoading]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    const convChanged = prevConvIdRef.current !== activeId;
    const grew = messages.length > prevLenRef.current;
    const behavior: ScrollBehavior = convChanged ? "auto" : "smooth";

    // Only scroll on conversation switch, message growth, or while sending.
    if (convChanged || grew || isSending) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      });
    }

    prevConvIdRef.current = activeId;
    prevLenRef.current = messages.length;
  }, [activeId, messages, isSending]);

  const handleSend = async (override?: string) => {
    if (isSending) return;
    const text = (override ?? input).trim();
    if (!text) return;
    setInput("");
    const result = await send({ conversationId: activeId, message: text });
    if (result?.conversationId && result.conversationId !== activeId) {
      setActiveId(result.conversationId);
    }
  };

  const handleSelect = (id: string | null) => {
    setActiveId(id);
    setInput("");
    setHistoryOpen(false);
  };

  const activeTitle =
    conversations.find((c) => c.id === activeId)?.title ||
    (activeId ? "Conversa" : "Nova conversa");

  return (
    <div className="relative flex flex-1 min-h-0 border rounded-lg overflow-hidden bg-card z-0">
      {/* Sidebar (desktop/tablet) — fixed width, never shrinks */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 border-r bg-muted/20 overflow-visible transition-[width] duration-200",
          sidebarCollapsed ? "w-0 border-r-0" : "w-[280px] xl:w-[320px]",
        )}
        aria-hidden={sidebarCollapsed}
      >
        {!sidebarCollapsed && (
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelect}
            onDelete={remove}
            isLoading={convLoading}
          />
        )}
      </aside>

      {/* Chat — fills remaining space */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Desktop header: toggle sidebar + title + (Novo when collapsed) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 border-b bg-background shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? "Mostrar histórico" : "Ocultar histórico"}
            title={sidebarCollapsed ? "Mostrar histórico" : "Ocultar histórico"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <p className="flex-1 min-w-0 text-sm font-medium truncate">{activeTitle}</p>
          {sidebarCollapsed && (
            <Button
              variant="default"
              size="sm"
              className="h-9 gap-1.5 shrink-0"
              onClick={() => handleSelect(null)}
              aria-label="Nova conversa"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Novo</span>
            </Button>
          )}
        </div>

        {/* Mobile header: history + new conversation */}
        <div className="flex md:hidden items-center justify-between gap-2 px-2 py-2 border-b bg-background shrink-0">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Abrir histórico de conversas"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] max-w-xs flex flex-col">
              <SheetHeader className="p-3 border-b shrink-0">
                <SheetTitle className="text-base text-left">Conversas</SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0">
                <ConversationList
                  conversations={conversations}
                  activeId={activeId}
                  onSelect={handleSelect}
                  onDelete={remove}
                  isLoading={convLoading}
                />
              </div>
            </SheetContent>
          </Sheet>
          <p className="flex-1 min-w-0 text-sm font-medium truncate px-1">
            {activeTitle}
          </p>
          <Button
            variant="default"
            size="sm"
            className="h-11 min-w-[44px] gap-1.5 px-2 min-[360px]:px-3"
            onClick={() => handleSelect(null)}
            aria-label="Nova conversa"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden min-[360px]:inline text-sm">Novo</span>
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea
            ref={scrollAreaRef}
            className="h-full w-full [&_[data-radix-scroll-area-viewport]>div]:!block [&_[data-radix-scroll-area-viewport]>div]:!w-full"
          >
            <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full min-w-0">
              {!activeId && messages.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <div className="inline-flex h-12 w-12 rounded-full bg-primary/10 text-primary items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold">Assistente IA Operacional</h2>
                  <p className="text-sm text-muted-foreground mt-1 mb-4 px-2">
                    Pergunte sobre estoque, vendas, redistribuição entre PDVs ou faturamento.
                  </p>
                  <div className="max-w-xl mx-auto">
                    <QuickActions onSelect={(p) => handleSend(p)} disabled={isSending} />
                  </div>
                </div>
              )}

              {msgsLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} conversationId={activeId} />
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-11">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Consultando seus dados…
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
}

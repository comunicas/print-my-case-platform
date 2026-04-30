import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAiConversations } from "@/hooks/useAiConversations";
import { useAiMessages } from "@/hooks/useAiMessages";
import { useAiChat } from "@/hooks/useAiChat";
import { ConversationList } from "./ConversationList";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";

export function AgentChatPanel() {
  const { conversations, isLoading: convLoading, remove } = useAiConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: messages = [], isLoading: msgsLoading } = useAiMessages(activeId);
  const { send, isSending } = useAiChat();
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (override?: string) => {
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
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-0 h-[calc(100svh-13rem)] min-h-[480px] max-h-[calc(100svh-8rem)] border rounded-lg overflow-hidden bg-card">
      {/* Sidebar (desktop/tablet) */}
      <aside className="hidden md:flex border-r bg-muted/30 min-w-0">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onDelete={remove}
          isLoading={convLoading}
        />
      </aside>

      {/* Chat */}
      <div className="flex flex-col min-w-0 min-h-0">
        {/* Mobile header: history + new conversation */}
        <div className="flex md:hidden items-center justify-between gap-2 px-2 py-2 border-b bg-background">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-2 gap-1.5 min-w-[44px]"
                aria-label="Abrir histórico de conversas"
              >
                <History className="h-4 w-4" />
                <span className="text-sm">Histórico</span>
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
          <p className="flex-1 text-sm font-medium truncate text-center px-1 min-w-0">
            {activeTitle}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-2 gap-1.5 min-w-[44px]"
            onClick={() => handleSelect(null)}
            aria-label="Nova conversa"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm sr-only sm:not-sr-only">Nova</span>
          </Button>
        </div>

        <div className="flex-1 overflow-hidden min-h-0" ref={scrollRef}>
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
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
                <MessageBubble key={m.id} message={m} />
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

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          isSending={isSending}
        />
      </div>
    </div>
  );
}

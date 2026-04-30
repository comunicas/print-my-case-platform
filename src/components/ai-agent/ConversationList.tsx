import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiConversation } from "@/hooks/useAiConversations";

interface Props {
  conversations: AiConversation[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

function groupByDate(items: AiConversation[]) {
  const today: AiConversation[] = [];
  const yesterday: AiConversation[] = [];
  const week: AiConversation[] = [];
  const older: AiConversation[] = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86_400_000;

  for (const c of items) {
    const t = new Date(c.last_message_at).getTime();
    if (t >= startOfToday) today.push(c);
    else if (t >= startOfToday - dayMs) yesterday.push(c);
    else if (t >= startOfToday - 7 * dayMs) week.push(c);
    else older.push(c);
  }
  return { today, yesterday, week, older };
}

export function ConversationList({ conversations, activeId, onSelect, onDelete, isLoading }: Props) {
  const groups = groupByDate(conversations);

  const renderGroup = (label: string, items: AiConversation[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 mb-1">{label}</p>
        <div className="space-y-1">
          {items.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] cursor-pointer hover:bg-muted",
                activeId === c.id && "bg-muted",
              )}
              onClick={() => onSelect(c.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{c.title || "Conversa sem título"}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Excluir conversa?")) onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                aria-label="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Conversas
        </span>
        <Button
          onClick={() => onSelect(null)}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Nova conversa"
          title="Nova conversa"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && <p className="text-xs text-muted-foreground p-2">Carregando…</p>}
          {!isLoading && conversations.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">Nenhuma conversa ainda.</p>
          )}
          {renderGroup("Hoje", groups.today)}
          {renderGroup("Ontem", groups.yesterday)}
          {renderGroup("Últimos 7 dias", groups.week)}
          {renderGroup("Mais antigas", groups.older)}
        </div>
      </ScrollArea>
    </div>
  );
}

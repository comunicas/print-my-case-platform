import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, MessagesSquare } from "lucide-react";
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
        <div className="space-y-0.5">
          {items.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-2 rounded-md pl-2 pr-2 py-2 text-[13px] cursor-pointer hover:bg-muted/70 border-l-2 border-transparent",
                activeId === c.id && "bg-accent text-accent-foreground border-l-primary hover:bg-accent",
              )}
              onClick={() => onSelect(c.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-medium">{c.title || "Conversa sem título"}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Excluir conversa?")) onDelete(c.id);
                }}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1 -m-1"
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
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessagesSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
            Conversas
          </span>
        </div>
        <Button
          onClick={() => onSelect(null)}
          variant="default"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          aria-label="Nova conversa"
          title="Nova conversa"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Novo</span>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2.5">
          {isLoading && <p className="text-xs text-muted-foreground p-2">Carregando…</p>}
          {!isLoading && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-8 px-3">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhuma conversa ainda</p>
              <p className="text-xs text-muted-foreground">
                Clique em <span className="font-medium">Novo</span> para iniciar um chat.
              </p>
            </div>
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

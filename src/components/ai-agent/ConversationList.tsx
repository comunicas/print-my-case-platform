import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MessageSquare, Trash2, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

function truncateTitle(text: string, max = 32) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function ConversationList({ conversations, activeId, onSelect, onDelete, isLoading }: Props) {
  const groups = groupByDate(conversations);
  const [pendingDelete, setPendingDelete] = useState<AiConversation | null>(null);

  const confirmDelete = () => {
    if (pendingDelete) {
      onDelete(pendingDelete.id);
      setPendingDelete(null);
    }
  };

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
                "group flex items-center gap-2 w-full min-w-0 overflow-hidden rounded-md pl-2 pr-1 py-2 text-[13px] cursor-pointer hover:bg-muted/70 border-l-2 border-transparent",
                activeId === c.id && "bg-accent text-accent-foreground border-l-primary hover:bg-accent",
              )}
              onClick={() => onSelect(c.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span
                className="flex-1 min-w-0 truncate font-medium pr-1"
                title={c.title || "Conversa sem título"}
              >
                {truncateTitle(c.title || "Conversa sem título")}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete(c);
                }}
                className="relative z-10 shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 focus-visible:text-destructive focus-visible:bg-destructive/10 transition-colors"
                aria-label={`Excluir conversa ${c.title || ""}`.trim()}
                title="Excluir conversa"
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
      <ScrollArea className="flex-1 [&_[data-radix-scroll-area-viewport]>div]:!block [&_[data-radix-scroll-area-viewport]>div]:!w-full">
        <div className="p-2.5">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Carregando conversas">
              <Skeleton className="h-3 w-12 ml-2" />
              <div className="space-y-1.5">
                {Array.from({ length: 6 }).map((_, i) => {
                  const widths = ["85%", "70%", "92%", "65%", "78%", "88%"];
                  return (
                    <div key={i} className="flex items-center gap-2 px-2 py-2">
                      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                      <Skeleton className="h-3.5" style={{ width: widths[i] }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground/70" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Nenhuma conversa ainda</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clique em <span className="font-medium text-foreground">Novo</span> para iniciar
                um chat com o assistente.
              </p>
            </div>
          ) : (
            <>
              {renderGroup("Hoje", groups.today)}
              {renderGroup("Ontem", groups.yesterday)}
              {renderGroup("Últimos 7 dias", groups.week)}
              {renderGroup("Mais antigas", groups.older)}
            </>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não pode ser desfeita. Todo o histórico de mensagens
              {pendingDelete?.title ? (
                <>
                  {" "}da conversa <span className="font-medium text-foreground">"{pendingDelete.title}"</span>
                </>
              ) : (
                " desta conversa"
              )}
              {" "}será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

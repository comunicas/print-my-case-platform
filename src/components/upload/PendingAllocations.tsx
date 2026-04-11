import { usePendingAllocations, PendingAllocation } from "@/hooks/usePendingAllocations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, Check, X, CheckCheck, Loader2, ChevronDown, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export function PendingAllocations() {
  const { pendingAllocations, resolvedAllocations, count, acceptAllocation, rejectAllocation, acceptAll } = usePendingAllocations();

  if (count === 0 && resolvedAllocations.length === 0) return null;

  return (
    <div className="space-y-3">
      {count > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-base text-foreground">
                  Sugestões de Alocação
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {count}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => acceptAll.mutate(pendingAllocations)}
                disabled={acceptAll.isPending}
              >
                {acceptAll.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCheck className="h-3 w-3 mr-1" />
                )}
                Confirmar Todas
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aumento de estoque detectado — confirme ou rejeite cada sugestão de alocação.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {pendingAllocations.map((allocation) => (
              <AllocationRow
                key={allocation.id}
                allocation={allocation}
                onAccept={() => acceptAllocation.mutate(allocation)}
                onReject={() => rejectAllocation.mutate(allocation.id)}
                isAccepting={acceptAllocation.isPending}
                isRejecting={rejectAllocation.isPending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {resolvedAllocations.length > 0 && <AllocationHistory allocations={resolvedAllocations} />}
    </div>
  );
}

function AllocationHistory({ allocations }: { allocations: PendingAllocation[] }) {
  const [open, setOpen] = useState(false);

  const statusConfig: Record<string, { label: string; className: string }> = {
    accepted: { label: "Aceita", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    rejected: { label: "Rejeitada", className: "bg-destructive/10 text-destructive" },
    undone: { label: "Desfeita", className: "bg-muted text-muted-foreground" },
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Histórico de Alocações ({allocations.length})
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-1">
        {allocations.map((a) => {
          const cfg = statusConfig[a.status] ?? statusConfig.undone;
          return (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border bg-background p-2.5 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{a.product_name}</p>
                <p className="text-muted-foreground">
                  {a.suggested_quantity} un. → {a.pdv?.name ?? "PDV"}
                  {a.resolved_at && (
                    <>
                      {" · "}
                      {formatDistanceToNow(new Date(a.resolved_at), { addSuffix: true, locale: ptBR })}
                    </>
                  )}
                </p>
              </div>
              <Badge className={cfg.className}>{cfg.label}</Badge>
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

function AllocationRow({
  allocation,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: {
  allocation: PendingAllocation;
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {allocation.product_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {allocation.suggested_quantity} un. → {allocation.pdv?.name ?? "PDV"}
          {" · "}
          {formatDistanceToNow(new Date(allocation.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          onClick={onAccept}
          disabled={isAccepting}
        >
          {isAccepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onReject}
          disabled={isRejecting}
        >
          {isRejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

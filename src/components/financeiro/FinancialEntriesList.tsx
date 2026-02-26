import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { FinancialEntry } from "@/hooks/useFinancialEntries";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_LABELS: Record<string, string> = {
  deducoes: "Dedução",
  implantacao: "Implantação",
  fixas: "Fixa",
};

function formatCurrency(value: number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface FinancialEntriesListProps {
  entries: FinancialEntry[];
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (entry: FinancialEntry) => void;
  onDelete: (id: string) => void;
}

export function FinancialEntriesList({
  entries,
  isLoading,
  isAdmin,
  onEdit,
  onDelete,
}: FinancialEntriesListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhuma despesa registrada neste mês.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card divide-y">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{entry.description}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {CATEGORY_LABELS[entry.category] ?? entry.category}
                </Badge>
              </div>
            </div>
            <span className="text-sm font-mono tabular-nums shrink-0">
              {formatCurrency(Number(entry.amount))}
            </span>
            {isAdmin && (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(entry.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

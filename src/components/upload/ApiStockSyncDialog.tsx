import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface PdvOption {
  id: string;
  name: string;
  machine_id: string;
}

interface ApiStockSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdvs: PdvOption[];
}

interface BrandRow {
  brand: string;
  qty_gateway: number;
  qty_db: number;
  slots_gateway: number;
  slots_db: number;
  diff: number;
}

interface StockVerification {
  ok: boolean;
  warnings: string[];
  total_slots_gateway: number;
  total_slots_db: number;
  total_quantity_gateway: number;
  total_quantity_db: number;
  active_slots_gateway: number;
  active_slots_db: number;
  by_brand: BrandRow[];
  duplicates: Array<{ slot_number: string; occurrences: number }>;
  missing_product_names: number;
}

interface PdvResult {
  pdv_id: string;
  pdv_name: string;
  status: "ready" | "error";
  inserted?: number;
  total?: number;
  error?: string;
  verification?: StockVerification;
}

export function ApiStockSyncDialog({ open, onOpenChange, pdvs }: ApiStockSyncDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<PdvResult[] | null>(null);

  const eligible = useMemo(() => pdvs.filter((p) => !!p.machine_id), [pdvs]);

  useEffect(() => {
    if (open) {
      setSelected(new Set(eligible.map((p) => p.id)));
      setResults(null);
    }
  }, [open, eligible]);

  const allSelected = eligible.length > 0 && selected.size === eligible.length;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(eligible.map((p) => p.id)) : new Set());
  };

  const togglePdv = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const handleSync = async () => {
    if (selected.size === 0) {
      toast.error("Selecione pelo menos um PDV");
      return;
    }
    setIsSyncing(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stock", {
        body: { pdv_ids: Array.from(selected) },
      });
      if (error) throw error;
      const list: PdvResult[] = data?.results ?? [];
      setResults(list);
      const ok = list.filter((r) => r.status === "ready").length;
      const err = list.filter((r) => r.status === "error").length;
      if (err === 0) toast.success(`Estoque sincronizado: ${ok} PDV(s)`);
      else toast.warning(`Sincronização parcial: ${ok} OK, ${err} com erro`);

      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["slots-data"] });
      queryClient.invalidateQueries({ queryKey: ["product-stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-history"] });
      queryClient.invalidateQueries({ queryKey: ["pre-stock"] });
      queryClient.invalidateQueries({ queryKey: ["pending-allocations"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha ao sincronizar estoque: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSyncing && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Atualizar Estoque via API
          </DialogTitle>
          <DialogDescription>
            Busca o estoque atual dos PDVs selecionados na API Kexiaozhan e atualiza
            todos os slots (snapshot completo por máquina).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                PDVs ({selected.size}/{eligible.length})
              </Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => toggleAll(!allSelected)}
                disabled={isSyncing || eligible.length === 0}
              >
                {allSelected ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="space-y-2">
                {eligible.map((p) => {
                  const r = results?.find((x) => x.pdv_id === p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={(v) => togglePdv(p.id, v === true)}
                        disabled={isSyncing}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          ID {p.machine_id}
                        </div>
                        {r && (
                          <div className="mt-1">
                            {r.status === "ready" ? (
                              <div className="space-y-1">
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {r.inserted ?? 0} slots
                                </Badge>
                                {r.verification && (
                                  <StockVerificationBlock v={r.verification} />
                                )}
                              </div>
                            ) : (
                              <Badge className="bg-destructive/10 text-destructive gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {r.error?.slice(0, 80) ?? "Erro"}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
                {eligible.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum PDV ativo com machine_id disponível.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSyncing}
          >
            Fechar
          </Button>
          <Button onClick={handleSync} disabled={isSyncing || selected.size === 0}>
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StockVerificationBlock({ v }: { v: StockVerification }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2 text-xs space-y-1">
      <div className="flex items-center gap-1 font-medium">
        {v.ok ? (
          <>
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-400">
              Verificação OK
            </span>
          </>
        ) : (
          <>
            <ShieldAlert className="h-3 w-3 text-amber-600" />
            <span className="text-amber-700 dark:text-amber-400">
              Divergências detectadas
            </span>
          </>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1 text-[11px]">
        <div className="text-muted-foreground">Slots</div>
        <div className="text-right tabular-nums">G {v.total_slots_gateway}</div>
        <div className="text-right tabular-nums">B {v.total_slots_db}</div>
        <div className="text-muted-foreground">Qtd total</div>
        <div className="text-right tabular-nums">G {v.total_quantity_gateway}</div>
        <div className="text-right tabular-nums">B {v.total_quantity_db}</div>
        <div className="text-muted-foreground">Ativos</div>
        <div className="text-right tabular-nums">G {v.active_slots_gateway}</div>
        <div className="text-right tabular-nums">B {v.active_slots_db}</div>
      </div>
      {v.by_brand.length > 0 && (
        <table className="w-full text-[11px] mt-1">
          <thead className="text-muted-foreground">
            <tr>
              <th className="text-left font-normal">Marca</th>
              <th className="text-right font-normal">Gateway</th>
              <th className="text-right font-normal">Banco</th>
              <th className="text-right font-normal">Δ</th>
            </tr>
          </thead>
          <tbody>
            {v.by_brand.map((b) => (
              <tr key={b.brand}>
                <td>{b.brand}</td>
                <td className="text-right tabular-nums">{b.qty_gateway}</td>
                <td className="text-right tabular-nums">{b.qty_db}</td>
                <td
                  className={`text-right tabular-nums ${
                    b.diff === 0 ? "text-muted-foreground" : "text-amber-600 font-medium"
                  }`}
                >
                  {b.diff > 0 ? `+${b.diff}` : b.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {v.duplicates.length > 0 && (
        <div className="text-amber-700 dark:text-amber-400">
          {v.duplicates.length} slot(s) duplicado(s) no gateway:{" "}
          {v.duplicates
            .slice(0, 3)
            .map((s) => `${s.slot_number}×${s.occurrences}`)
            .join(", ")}
          {v.duplicates.length > 3 ? "…" : ""}
        </div>
      )}
      {v.missing_product_names > 0 && (
        <div className="text-amber-700 dark:text-amber-400">
          {v.missing_product_names} canal(is) sem produto resolvido (ignorados)
        </div>
      )}
    </div>
  );
}
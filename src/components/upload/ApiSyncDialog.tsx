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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Cloud, ShieldCheck, ShieldAlert } from "lucide-react";

interface PdvOption {
  id: string;
  name: string;
  machine_id: string;
}

interface ApiSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdvs: PdvOption[];
}

interface PdvResult {
  pdv_id: string;
  pdv_name: string;
  status: "ready" | "error";
  inserted?: number;
  total?: number;
  error?: string;
  verification?: {
    ok: boolean;
    warnings: string[];
    by_status_gateway: Record<string, { count: number; amount: number }>;
    by_status_db: Record<string, { count: number; amount: number }>;
    divergences: Array<{ status: string; gateway_count: number; db_count: number; diff: number }>;
    duplicates: { count: number; samples: Array<{ order_number: string; occurrences: number }> };
    cross_source_skipped: number;
    out_of_period: number;
  };
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function ApiSyncDialog({ open, onOpenChange, pdvs }: ApiSyncDialogProps) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<string>(currentMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<PdvResult[] | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(new Set(pdvs.map((p) => p.id)));
      setResults(null);
      setPeriod(currentMonth());
    }
  }, [open, pdvs]);

  const allSelected = useMemo(
    () => pdvs.length > 0 && selected.size === pdvs.length,
    [pdvs.length, selected.size],
  );

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(pdvs.map((p) => p.id)) : new Set());
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
    if (!/^\d{4}-\d{2}$/.test(period)) {
      toast.error("Mês inválido. Use formato AAAA-MM");
      return;
    }

    setIsSyncing(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-revenue", {
        body: { period, pdv_ids: Array.from(selected) },
      });
      if (error) throw error;
      const list: PdvResult[] = data?.results ?? [];
      setResults(list);
      const ok = list.filter((r) => r.status === "ready").length;
      const err = list.filter((r) => r.status === "error").length;
      if (err === 0) toast.success(`Sincronizado: ${ok} PDV(s)`);
      else toast.warning(`Sincronização parcial: ${ok} OK, ${err} com erro`);

      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data-range"] });
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      queryClient.invalidateQueries({ queryKey: ["sales-records"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha ao sincronizar: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSyncing && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Atualizar via API
          </DialogTitle>
          <DialogDescription>
            Busca os pedidos diretamente da API Kexiaozhan e atualiza as vendas dos PDVs
            selecionados para o mês escolhido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-sync-period">Mês de referência</Label>
            <Input
              id="api-sync-period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={isSyncing}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>PDVs ({selected.size}/{pdvs.length})</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => toggleAll(!allSelected)}
                disabled={isSyncing}
              >
                {allSelected ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="space-y-2">
                {pdvs.map((p) => {
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
                                  {r.inserted ?? 0} pedidos
                                </Badge>
                                {r.verification && (
                                  <VerificationBlock v={r.verification} />
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
                {pdvs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum PDV ativo disponível.
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

function VerificationBlock({ v }: { v: NonNullable<PdvResult["verification"]> }) {
  const statuses = ["Concluído", "Pendente", "Cancelado", "Reembolsado"];
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
      <table className="w-full text-[11px]">
        <thead className="text-muted-foreground">
          <tr>
            <th className="text-left font-normal">Status</th>
            <th className="text-right font-normal">Gateway</th>
            <th className="text-right font-normal">Banco</th>
            <th className="text-right font-normal">Δ</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((s) => {
            const g = v.by_status_gateway[s]?.count ?? 0;
            const d = v.by_status_db[s]?.count ?? 0;
            const diff = d - g;
            return (
              <tr key={s}>
                <td>{s}</td>
                <td className="text-right tabular-nums">{g}</td>
                <td className="text-right tabular-nums">{d}</td>
                <td
                  className={`text-right tabular-nums ${
                    diff === 0 ? "text-muted-foreground" : "text-amber-600 font-medium"
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {v.duplicates.count > 0 && (
        <div className="text-amber-700 dark:text-amber-400">
          {v.duplicates.count} pedido(s) duplicado(s):{" "}
          {v.duplicates.samples
            .slice(0, 3)
            .map((s) => `${s.order_number}×${s.occurrences}`)
            .join(", ")}
          {v.duplicates.samples.length > 3 ? "…" : ""}
        </div>
      )}
      {v.cross_source_skipped > 0 && (
        <div className="text-muted-foreground">
          {v.cross_source_skipped} pedido(s) já existiam via planilha/manual
          (mantidos os originais)
        </div>
      )}
      {v.out_of_period > 0 && (
        <div className="text-muted-foreground">
          {v.out_of_period} pedido(s) fora do mês (descartados)
        </div>
      )}
    </div>
  );
}

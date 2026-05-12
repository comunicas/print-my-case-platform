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
import { Progress } from "@/components/ui/progress";
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

type Stage = "idle" | "login" | "channels" | "products" | "writing" | "done" | "error";
interface PdvProgress {
  stage: Stage;
  loginDone?: boolean;
  channelsDone?: boolean;
  productsDone?: boolean;
  writingDone?: boolean;
  channelsPage?: number;
  channelsCount?: number;
  channelsTotal?: number;
  insertedCount?: number;
  errorMsg?: string;
}

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Aguardando",
  login: "Login",
  channels: "Canais",
  products: "Produtos",
  writing: "Gravação",
  done: "Concluído",
  error: "Erro",
};

function progressPercent(p: PdvProgress | undefined): number {
  if (!p) return 0;
  if (p.stage === "done") return 100;
  if (p.stage === "error") return 100;
  let pct = 0;
  if (p.loginDone) pct = 25;
  if (p.channelsDone) pct = 50;
  if (p.productsDone) pct = 75;
  if (p.writingDone) pct = 100;
  return pct;
}

export function ApiStockSyncDialog({ open, onOpenChange, pdvs }: ApiStockSyncDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<PdvResult[] | null>(null);
  const [progress, setProgress] = useState<Record<string, PdvProgress>>({});

  const eligible = useMemo(() => pdvs.filter((p) => !!p.machine_id), [pdvs]);

  useEffect(() => {
    if (open) {
      setSelected(new Set(eligible.map((p) => p.id)));
      setResults(null);
      setProgress({});
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
    const initial: Record<string, PdvProgress> = {};
    for (const id of selected) initial[id] = { stage: "idle" };
    setProgress(initial);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-stock`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ pdv_ids: Array.from(selected), stream: true }),
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt.slice(0, 200)}`);
      }

      const list: PdvResult[] = [];
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!raw.trim() || raw.startsWith(":")) continue;
          let event = "message";
          let dataStr = "";
          for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
          }
          if (!dataStr) continue;
          let payload: any;
          try {
            payload = JSON.parse(dataStr);
          } catch {
            continue;
          }
          if (event === "stage") {
            const pid = payload.pdv_id as string;
            setProgress((prev) => {
              const cur: PdvProgress = { ...(prev[pid] ?? { stage: "idle" }) };
              const stage = payload.stage as Stage;
              if (payload.status === "error") {
                cur.stage = "error";
                cur.errorMsg = payload.message;
              } else {
                cur.stage = stage;
                if (stage === "login" && (payload.status === "done" || payload.status === "cached")) {
                  cur.loginDone = true;
                }
                if (stage === "channels") {
                  if (payload.status === "progress") {
                    cur.channelsPage = payload.page;
                    cur.channelsCount = payload.count;
                  } else if (payload.status === "done") {
                    cur.channelsDone = true;
                    cur.channelsTotal = payload.total;
                  }
                }
                if (stage === "products" && (payload.status === "done" || payload.status === "skip")) {
                  cur.productsDone = true;
                }
                if (stage === "writing") {
                  if (payload.status === "start") cur.channelsTotal = payload.total ?? cur.channelsTotal;
                  if (payload.status === "done") {
                    cur.writingDone = true;
                    cur.insertedCount = payload.inserted;
                  }
                }
              }
              return { ...prev, [pid]: cur };
            });
          } else if (event === "pdv") {
            list.push(payload as PdvResult);
            const pid = payload.pdv_id as string;
            setProgress((prev) => ({
              ...prev,
              [pid]: {
                ...(prev[pid] ?? { stage: "idle" }),
                stage: payload.status === "ready" ? "done" : "error",
                errorMsg: payload.error,
                insertedCount: payload.inserted,
              },
            }));
          } else if (event === "end") {
            // results fully captured
          } else if (event === "error") {
            throw new Error(payload?.message ?? "Erro no stream");
          }
        }
      }
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
                  const pg = progress[p.id];
                  const showProgress = isSyncing && pg && pg.stage !== "done" && pg.stage !== "error";
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
                        {showProgress && (
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {STAGE_LABEL[pg.stage]}
                                {pg.stage === "channels" && pg.channelsCount != null
                                  ? ` · pág ${pg.channelsPage} · ${pg.channelsCount}`
                                  : ""}
                              </Badge>
                              <span className="text-[10px] tabular-nums text-muted-foreground">
                                {progressPercent(pg)}%
                              </span>
                            </div>
                            <Progress value={progressPercent(pg)} className="h-1.5" />
                          </div>
                        )}
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
import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDREConfig } from "@/hooks/useDREConfig";

interface DREConfigCardProps {
  pdvId?: string | null;
}

export function DREConfigCard({ pdvId }: DREConfigCardProps) {
  const { unitCost, stoneRate, taxRate, upsertConfig, isLoading, isFromPdv } = useDREConfig({ pdvId });
  const [open, setOpen] = useState(false);
  const [localUnitCost, setLocalUnitCost] = useState("");
  const [localStoneRate, setLocalStoneRate] = useState("");
  const [localTaxRate, setLocalTaxRate] = useState("");
  const [scope, setScope] = useState<"global" | "pdv">("global");

  useEffect(() => {
    if (!isLoading) {
      setLocalUnitCost(unitCost > 0 ? String(unitCost) : "");
      setLocalStoneRate(stoneRate > 0 ? String(+(stoneRate * 100).toFixed(4)) : "");
      setLocalTaxRate(taxRate > 0 ? String(+(taxRate * 100).toFixed(4)) : "");
      setScope(isFromPdv ? "pdv" : "global");
    }
  }, [unitCost, stoneRate, taxRate, isLoading, isFromPdv]);

  const handleSave = () => {
    upsertConfig.mutate({
      unit_cost: Number(localUnitCost) || 0,
      stone_rate: (Number(localStoneRate) || 0) / 100,
      tax_rate: (Number(localTaxRate) || 0) / 100,
      pdv_id: scope === "pdv" && pdvId ? pdvId : null,
    });
  };

  const hasChanges =
    (Number(localUnitCost) || 0) !== unitCost ||
    (Number(localStoneRate) || 0) / 100 !== stoneRate ||
    (Number(localTaxRate) || 0) / 100 !== taxRate ||
    (scope === "pdv") !== isFromPdv;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Configurar custos
          </Button>
        </CollapsibleTrigger>
        {open && isFromPdv && (
          <Badge variant="secondary" className="text-xs">Específico do PDV</Badge>
        )}
        {open && !isFromPdv && pdvId && (
          <Badge variant="outline" className="text-xs">Herdado (global)</Badge>
        )}
      </div>
      <CollapsibleContent>
        <div className="rounded-xl border bg-card p-4 mt-3 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">Parâmetros de Custos Variáveis</h4>
            {pdvId && (
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                value={scope}
                onValueChange={(v) => { if (v) setScope(v as "global" | "pdv"); }}
              >
                <ToggleGroupItem value="global" className="text-xs px-3">
                  Global
                </ToggleGroupItem>
                <ToggleGroupItem value="pdv" className="text-xs px-3">
                  Este PDV
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="unit-cost" className="text-xs">Custo unitário médio (R$)</Label>
              <Input
                id="unit-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="17.00"
                value={localUnitCost}
                onChange={(e) => setLocalUnitCost(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stone-rate" className="text-xs">Taxa Stone MDR (%)</Label>
              <Input
                id="stone-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="2.00"
                value={localStoneRate}
                onChange={(e) => setLocalStoneRate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax-rate" className="text-xs">Alíquota de impostos (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={localTaxRate}
                onChange={(e) => setLocalTaxRate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || upsertConfig.isPending}>
              {upsertConfig.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

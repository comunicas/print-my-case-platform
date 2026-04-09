import { useMemo } from "react";
import { PreStockItem } from "@/hooks/usePreStock";
import { extractBrandFromProductName } from "@/lib/productNormalization";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

interface GroupedModel {
  productName: string;
  brand: string;
  totalQuantity: number;
  remainingQuantity: number;
  allocatedQuantity: number;
  pendingValue: number;
}

interface PreStockRankingProps {
  items: PreStockItem[];
}

export function PreStockRanking({ items }: PreStockRankingProps) {
  const ranked = useMemo(() => {
    const grouped = items.reduce<Record<string, GroupedModel>>((acc, item) => {
      const key = item.product_name;
      if (!acc[key]) {
        acc[key] = {
          productName: key,
          brand: extractBrandFromProductName(key),
          totalQuantity: 0,
          remainingQuantity: 0,
          allocatedQuantity: 0,
          pendingValue: 0,
        };
      }
      acc[key].totalQuantity += item.quantity;
      acc[key].remainingQuantity += item.remaining_quantity;
      acc[key].allocatedQuantity += item.quantity - item.remaining_quantity;
      acc[key].pendingValue += item.remaining_quantity * (item.unit_cost ?? 15);
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.remainingQuantity - a.remainingQuantity);
  }, [items]);

  if (ranked.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">Nenhum modelo encontrado</h3>
        <p className="text-sm text-muted-foreground mt-1">Registre compras para ver o ranking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ranked.map((model, index) => {
        const allocatedPct = model.totalQuantity > 0
          ? Math.round((model.allocatedQuantity / model.totalQuantity) * 100)
          : 0;

        return (
          <Card key={model.productName} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span className="text-lg font-bold text-muted-foreground w-8 text-right shrink-0">
                  #{index + 1}
                </span>

                {/* Brand logo */}
                <BrandLogo brand={model.brand} size="md" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-foreground truncate">
                      {model.productName}
                    </span>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      {model.pendingValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={allocatedPct} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0 w-28 text-right">
                      {model.remainingQuantity} pend. / {model.allocatedQuantity} aloc.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{model.totalQuantity} un. compradas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

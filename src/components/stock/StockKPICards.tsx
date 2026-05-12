import React from 'react';
import { Package, Boxes, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StockKPIs } from '@/lib/stockUtils';

interface StockKPICardsProps {
  kpis: StockKPIs;
  globalKpis?: StockKPIs;
  isLoading?: boolean;
  onCardClick?: (filter: string) => void;
}

export const StockKPICards = React.memo(function StockKPICards({ kpis, globalKpis, isLoading, onCardClick }: StockKPICardsProps) {
  const isFiltered = !!globalKpis;

  const formatValue = (filtered: number, global: number | undefined) => {
    if (!isFiltered || global === undefined) return String(filtered);
    return `${filtered} de ${global}`;
  };

  const cards = [
    {
      title: 'Total Produtos',
      value: formatValue(kpis.totalProducts, globalKpis?.totalProducts),
      icon: Package,
      description: isFiltered ? 'Filtrado' : 'Modelos únicos',
    },
    {
      title: 'Total Unidades',
      value: formatValue(kpis.totalUnits, globalKpis?.totalUnits),
      icon: Boxes,
      description: isFiltered ? 'Filtrado' : 'Itens em estoque',
    },
    {
      title: 'Repor',
      value: String(kpis.criticalProducts),
      icon: AlertTriangle,
      description: '0 unidades',
      highlight: kpis.criticalProducts > 0 ? 'destructive' : undefined,
      filter: 'restock',
    },
    {
      title: 'Atenção',
      value: String(kpis.warningProducts),
      icon: RefreshCw,
      description: '1-2 unidades',
      highlight: kpis.warningProducts > 0 ? 'warning' : undefined,
      filter: 'warning',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {cards.map((card) => {
        const valueColor =
          card.highlight === 'destructive' ? 'text-destructive'
          : card.highlight === 'warning' ? 'text-[hsl(38_92%_38%)]'
          : 'text-foreground';
        const iconColor =
          card.highlight === 'destructive' ? 'text-destructive'
          : card.highlight === 'warning' ? 'text-[hsl(38_92%_38%)]'
          : 'text-muted-foreground';
        return (
          <Card
            key={card.title}
            className={cn(
              "p-4 transition-all duration-200",
              onCardClick && card.filter && "cursor-pointer hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_20px_hsl(var(--primary)/0.10)]"
            )}
            onClick={() => onCardClick && card.filter ? onCardClick(card.filter) : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={cn("text-[24px] md:text-[28px] font-extrabold leading-none truncate", valueColor)}>
                  {isLoading ? '-' : card.value}
                </p>
                <p className="text-[12px] text-muted-foreground font-medium mt-1">{card.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.description}</p>
              </div>
              <card.icon className={cn("h-5 w-5 shrink-0", iconColor)} />
            </div>
          </Card>
        );
      })}
    </div>
  );
});

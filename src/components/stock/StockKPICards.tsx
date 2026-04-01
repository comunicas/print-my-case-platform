import React from 'react';
import { Package, Boxes, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StockKPIs } from '@/lib/stockUtils';

interface StockKPICardsProps {
  kpis: StockKPIs;
  globalKpis?: StockKPIs;
  isLoading?: boolean;
}

export const StockKPICards = React.memo(function StockKPICards({ kpis, globalKpis, isLoading }: StockKPICardsProps) {
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
    },
    {
      title: 'Atenção',
      value: String(kpis.warningProducts),
      icon: RefreshCw,
      description: '1-2 unidades',
      highlight: kpis.warningProducts > 0 ? 'warning' : undefined,
    },
  ];

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="px-3 md:px-4 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-lg md:text-2xl font-bold ${
                  card.highlight === 'destructive' ? 'text-destructive' : 
                  card.highlight === 'warning' ? 'text-orange-500' : ''
                }`}>
                  {isLoading ? '-' : card.value}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{card.description}</p>
              </div>
              <card.icon className={`h-6 w-6 md:h-8 md:w-8 ${
                card.highlight === 'destructive' ? 'text-destructive' : 
                card.highlight === 'warning' ? 'text-orange-500' : 'text-muted-foreground'
              }`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

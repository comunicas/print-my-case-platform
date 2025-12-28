import { Package, Boxes, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StockKPIs } from '@/lib/stockUtils';

interface StockKPICardsProps {
  kpis: StockKPIs;
  isLoading?: boolean;
}

export function StockKPICards({ kpis, isLoading }: StockKPICardsProps) {
  const cards = [
    {
      title: 'Total Produtos',
      value: kpis.totalProducts,
      icon: Package,
      description: 'Modelos únicos',
    },
    {
      title: 'Total Unidades',
      value: kpis.totalUnits,
      icon: Boxes,
      description: 'Itens em estoque',
    },
    {
      title: 'Produtos Críticos',
      value: kpis.criticalProducts,
      icon: AlertTriangle,
      description: 'Precisam reposição',
      highlight: kpis.criticalProducts > 0 ? 'destructive' : undefined,
    },
    {
      title: 'Redistribuir',
      value: kpis.redistributeProducts,
      icon: RefreshCw,
      description: 'Rebalancear slots',
      highlight: kpis.redistributeProducts > 0 ? 'warning' : undefined,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${
                  card.highlight === 'destructive' ? 'text-destructive' : 
                  card.highlight === 'warning' ? 'text-orange-500' : ''
                }`}>
                  {isLoading ? '-' : card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <card.icon className={`h-8 w-8 ${
                card.highlight === 'destructive' ? 'text-destructive' : 
                card.highlight === 'warning' ? 'text-orange-500' : 'text-muted-foreground'
              }`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

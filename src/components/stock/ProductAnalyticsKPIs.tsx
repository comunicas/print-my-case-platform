import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductAnalyticsKPIsProps {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  stockPercentage: number;
  isLoading?: boolean;
}

export function ProductAnalyticsKPIs({
  totalSales,
  totalRevenue,
  averageTicket,
  stockPercentage,
  isLoading,
}: ProductAnalyticsKPIsProps) {
  const kpis = [
    {
      label: 'Vendas',
      value: totalSales.toLocaleString('pt-BR'),
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Receita',
      value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Ticket Médio',
      value: averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: Receipt,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Ocupação',
      value: `${stockPercentage}%`,
      icon: Package,
      color: stockPercentage > 50 ? 'text-green-500' : stockPercentage > 20 ? 'text-yellow-500' : 'text-destructive',
      bgColor: stockPercentage > 50 ? 'bg-green-500/10' : stockPercentage > 20 ? 'bg-yellow-500/10' : 'bg-destructive/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-3 bg-muted/30 rounded-lg animate-pulse">
            <div className="h-4 w-16 bg-muted rounded mb-2" />
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="p-3 bg-muted/30 rounded-lg flex items-start gap-3"
        >
          <div className={cn('p-2 rounded-lg', kpi.bgColor)}>
            <kpi.icon className={cn('h-4 w-4', kpi.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
            <p className="text-sm font-semibold truncate">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

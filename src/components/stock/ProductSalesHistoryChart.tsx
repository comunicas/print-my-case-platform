import { useState } from 'react';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useProductSalesHistory, SalesHistoryResult } from '@/hooks/useProductSalesHistory';
import { cn } from '@/lib/utils';

interface ProductSalesHistoryChartProps {
  productName: string | null;
  pdvId?: string;
}

const periodOptions = [
  { label: '7d', days: 7 },
  { label: '15d', days: 15 },
  { label: '30d', days: 30 },
];

const chartConfig = {
  salesCount: {
    label: 'Vendas',
    color: 'hsl(var(--primary))',
  },
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--chart-2))',
  },
};

function TrendBadge({ trend }: { trend: SalesHistoryResult['trend'] }) {
  const { percentage, direction } = trend;

  if (percentage === null) {
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="h-3 w-3" />
        Sem dados anteriores
      </Badge>
    );
  }

  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const colorClass = direction === 'up' 
    ? 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400' 
    : direction === 'down' 
    ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400'
    : '';

  return (
    <Badge variant="outline" className={cn('gap-1', colorClass)}>
      <Icon className="h-3 w-3" />
      {direction === 'up' && '+'}
      {percentage}% vs período anterior
    </Badge>
  );
}

export function ProductSalesHistoryChart({ productName, pdvId }: ProductSalesHistoryChartProps) {
  const [selectedDays, setSelectedDays] = useState(15);
  
  const { data: historyData, isLoading } = useProductSalesHistory({
    productName,
    days: selectedDays,
    pdvId
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[140px] w-full" />
      </div>
    );
  }

  if (!historyData || historyData.data.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Histórico de Vendas</span>
        </div>
        <div className="flex items-center justify-center h-[100px] bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhuma venda registrada</p>
        </div>
      </div>
    );
  }

  const totalSales = historyData.data.reduce((sum, d) => sum + d.salesCount, 0);
  const totalRevenue = historyData.data.reduce((sum, d) => sum + d.revenue, 0);

  // Show fewer X-axis labels based on period
  const tickInterval = selectedDays <= 7 ? 0 : selectedDays <= 15 ? 2 : 4;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Histórico de Vendas</span>
        </div>
        <div className="flex gap-1">
          {periodOptions.map((option) => (
            <Button
              key={option.days}
              variant={selectedDays === option.days ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedDays(option.days)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[120px] w-full">
        <AreaChart
          data={historyData.data}
          margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
          <XAxis
            dataKey="dateDisplay"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            className="fill-muted-foreground"
            interval={tickInterval}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            className="fill-muted-foreground"
            allowDecimals={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (name === 'salesCount') {
                    return [`${value} vendas`, 'Vendas'];
                  }
                  return [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                    'Receita'
                  ];
                }}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="salesCount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#salesGradient)"
          />
        </AreaChart>
      </ChartContainer>

      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4 text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{totalSales} vendas</strong>
          </span>
          <span>
            Receita: <strong className="text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </strong>
          </span>
        </div>
        <TrendBadge trend={historyData.trend} />
      </div>
    </div>
  );
}

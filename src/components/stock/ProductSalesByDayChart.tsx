import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { pluralize } from '@/lib/utils';

interface SalesByDay {
  day: number;
  dayName: string;
  count: number;
  revenue: number;
}

interface ProductSalesByDayChartProps {
  data: SalesByDay[];
  bestDay: { day: number; dayName: string; count: number } | null;
  isLoading?: boolean;
}

export function ProductSalesByDayChart({ data, bestDay, isLoading }: ProductSalesByDayChartProps) {
  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
        <div className="h-[200px] bg-muted/30 rounded animate-pulse" />
      </div>
    );
  }

  const hasData = data.some(d => d.count > 0);

  if (!hasData) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vendas por Dia da Semana</span>
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Sem dados de vendas por dia
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vendas por Dia da Semana</span>
        </div>
        {bestDay && bestDay.count > 0 && (
          <Badge variant="secondary" className="text-xs">
            Melhor: {bestDay.dayName} ({bestDay.count})
          </Badge>
        )}
      </div>
      
      <div 
        className="h-[200px]"
        role="img"
        aria-label={`Gráfico de vendas por dia da semana${bestDay ? `. Melhor dia: ${bestDay.dayName} com ${bestDay.count} vendas` : ''}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="dayName" 
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as SalesByDay;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs">
                      <p className="font-medium">{data.dayName}</p>
                      <p className="text-muted-foreground">
                        {pluralize(data.count, 'venda', 'vendas')}
                      </p>
                      <p className="text-muted-foreground">
                        {data.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.day === bestDay?.day 
                    ? 'hsl(var(--primary))' 
                    : `hsl(var(--primary) / ${0.3 + (entry.count / maxCount) * 0.7})`
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

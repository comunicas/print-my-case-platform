import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { pluralize } from '@/lib/utils';

interface SalesByHour {
  hour: number;
  count: number;
  revenue: number;
}

interface ProductSalesByHourChartProps {
  data: SalesByHour[];
  peakHour: { hour: number; count: number } | null;
  isLoading?: boolean;
}

export function ProductSalesByHourChart({ data, peakHour, isLoading }: ProductSalesByHourChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      label: `${String(item.hour).padStart(2, '0')}h`,
    }));
  }, [data]);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-[200px] bg-muted/30 rounded animate-pulse" />
      </div>
    );
  }

  const hasData = data.some(d => d.count > 0);

  if (!hasData) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vendas por Hora</span>
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Sem dados de vendas por hora
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="sales-by-hour-chart">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vendas por Hora</span>
        </div>
        {peakHour && peakHour.count > 0 && (
          <Badge variant="secondary" className="text-xs">
            Pico: {String(peakHour.hour).padStart(2, '0')}h ({peakHour.count})
          </Badge>
        )}
      </div>
      
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10 }}
              interval={2}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs">
                      <p className="font-medium">{data.label}</p>
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
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.hour === peakHour?.hour 
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

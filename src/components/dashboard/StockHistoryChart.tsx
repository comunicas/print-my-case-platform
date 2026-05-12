import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { pluralize } from "@/lib/utils";
import { getBrandChartColor } from "@/lib/brandAssets";
import { ChartCard } from "./ChartCard";
import { useStockHistory } from "@/hooks/useStockHistory";
import { STOCK_HISTORY_DAYS } from "@/lib/constants";

interface StockHistoryChartProps {
  organizationId?: string;
  pdvId?: string;
  animationDelay?: number;
}

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "15d", days: 15 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function StockHistoryChart({ organizationId, pdvId, animationDelay = 0 }: StockHistoryChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { data: stockHistory } = useStockHistory({ days: STOCK_HISTORY_DAYS, organizationId, pdvId });

  const data = stockHistory?.chartData ?? [];
  const brands = stockHistory?.brands ?? [];

  // Filtra dados pelo período selecionado
  const filteredData = data.slice(-selectedPeriod);

  const chartConfig = brands.reduce((acc, brand) => {
    acc[brand] = { label: brand, color: getBrandChartColor(brand) };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  if (data.length === 0) return null;

  const periodButtons = (
    <Badge variant="outline" className="gap-1 p-0.5">
      {PERIOD_OPTIONS.map((option) => (
        <Button
          key={option.days}
          data-testid={`period-${option.label.toLowerCase()}`}
          variant={selectedPeriod === option.days ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedPeriod(option.days)}
          className="h-6 px-2 text-xs"
          aria-label={`Mostrar últimos ${option.days} dias`}
          aria-pressed={selectedPeriod === option.days}
        >
          {option.label}
        </Button>
      ))}
    </Badge>
  );

  return (
    <ChartCard
      testId="stock-history-chart"
      title="Evolução do Estoque"
      description="Histórico de estoque por marca no período"
      icon={History}
      iconColor="text-primary"
      headerBadge={periodButtons}
      animationDelay={animationDelay}
    >
      {filteredData.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateDisplay"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              interval="preserveStartEnd"
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    return [
                      <div key="tooltip" className="flex flex-col gap-0.5">
                        <span className="font-medium">{name}</span>
                        <span>{pluralize(Number(value), 'unidade', 'unidades')}</span>
                      </div>,
                      ""
                    ];
                  }}
                  labelFormatter={(label) => (
                    <span className="font-medium text-sm mb-1 block">{label}</span>
                  )}
                />
              }
            />
            {brands.map((brand) => (
              <Line
                key={brand}
                type="monotone"
                dataKey={brand}
                stroke={getBrandChartColor(brand)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            <ChartLegend
              content={
                <ChartLegendContent
                  payload={brands.map(brand => ({
                    value: brand,
                    type: "line",
                    color: getBrandChartColor(brand),
                  }))}
                />
              }
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div data-testid="stock-history-empty" className="flex-1 min-h-[250px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de histórico disponível
        </div>
      )}
    </ChartCard>
  );
}

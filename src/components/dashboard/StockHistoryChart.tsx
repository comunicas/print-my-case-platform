import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { exportToExcel } from "@/lib/dashboardUtils";
import { getBrandChartColor } from "@/lib/brandAssets";

interface StockHistoryData {
  date: string;
  dateDisplay: string;
  [brand: string]: string | number;
}

interface StockHistoryChartProps {
  data: StockHistoryData[];
  brands: string[];
}

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "15d", days: 15 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function StockHistoryChart({ data, brands }: StockHistoryChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  
  // Filtra dados pelo período selecionado
  const filteredData = data.slice(-selectedPeriod);
  
  const chartConfig = brands.reduce((acc, brand) => {
    acc[brand] = { label: brand, color: getBrandChartColor(brand) };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);
  
  const handleExport = () => {
    exportToExcel(
      filteredData.map(d => {
        const row: Record<string, any> = { Data: d.dateDisplay };
        brands.forEach(brand => {
          row[brand] = d[brand] || 0;
        });
        return row;
      }),
      "historico-estoque"
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <CardTitle className="text-base md:text-lg">Evolução do Estoque</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.days}
                variant={selectedPeriod === option.days ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(option.days)}
                className="h-7 px-2 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {filteredData.length > 0 ? (
          <ChartContainer config={chartConfig} className="flex-1 min-h-[250px] w-full">
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
              <ChartTooltip content={<ChartTooltipContent />} />
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
          <div className="flex-1 min-h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado de histórico disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}

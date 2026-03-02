import { ReactNode } from "react";
import { Download, LucideIcon, AreaChart as AreaChartIcon, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ChartType = "area" | "bar" | "line";

const chartTypeIcons: Record<ChartType, LucideIcon> = {
  area: AreaChartIcon,
  bar: BarChart3,
  line: LineChartIcon,
};

interface ChartCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  onExport?: () => void;
  exportTestId?: string;
  headerBadge?: ReactNode;
  children: ReactNode;
  testId?: string;
  className?: string;
  animationDelay?: number;
  chartTypeOptions?: ChartType[];
  activeChartType?: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
}

export function ChartCard({
  title,
  description,
  icon: Icon,
  iconColor,
  onExport,
  exportTestId,
  headerBadge,
  children,
  testId,
  className,
  animationDelay = 0,
  chartTypeOptions,
  activeChartType,
  onChartTypeChange,
}: ChartCardProps) {
  return (
    <Card 
      data-testid={testId} 
      className={cn("flex flex-col animate-fade-in-up", className)}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
    >
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Icon className={cn("h-5 w-5", iconColor)} />
              {title}
            </CardTitle>
            {headerBadge}
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {chartTypeOptions && chartTypeOptions.length > 1 && activeChartType && onChartTypeChange && (
            <ToggleGroup
              type="single"
              size="sm"
              value={activeChartType}
              onValueChange={(v) => v && onChartTypeChange(v as ChartType)}
            >
              {chartTypeOptions.map((type) => {
                const TypeIcon = chartTypeIcons[type];
                return (
                  <ToggleGroupItem key={type} value={type} aria-label={type}>
                    <TypeIcon className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          )}
          {onExport && (
            <Button data-testid={exportTestId} variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {children}
      </CardContent>
    </Card>
  );
}

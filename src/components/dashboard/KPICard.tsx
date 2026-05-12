import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TrendData, formatTrendTooltip, formatTrendBadge } from "@/lib/trendUtils";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: TrendData;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
  testId?: string;
}

const variantStyles = {
  default: "text-primary",
  success: "text-emerald-500",
  warning: "text-yellow-500",
  danger: "text-destructive",
};

const variantIconColors: Record<NonNullable<KPICardProps["variant"]>, string> = {
  default: "hsl(var(--primary))",
  success: "hsl(158 64% 40%)",
  warning: "hsl(38 92% 50%)",
  danger: "hsl(var(--destructive))",
};

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "default",
  testId,
}: KPICardProps) {
  const showTrend = trend && trend.percentage !== null;
  
  const getTrendIcon = () => {
    if (!trend || trend.percentage === null) return Minus;
    return trend.isPositive ? TrendingUp : TrendingDown;
  };
  
  const getTrendColor = () => {
    if (!trend || trend.percentage === null) return "text-muted-foreground";
    return trend.isPositive ? "text-emerald-500" : "text-destructive";
  };
  
  const TrendIcon = getTrendIcon();
  const iconColor = variantIconColors[variant];
  const isUp = trend?.isPositive;

  return (
    <Card
      data-testid={testId}
      className="overflow-hidden min-h-[88px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_20px_hsl(var(--primary)/0.10)]"
    >
      <CardHeader className="flex flex-row items-center justify-between p-0 pb-2 space-y-0">
        <CardTitle className="text-[11.5px] md:text-[12px] font-medium text-muted-foreground truncate pr-2">
          {title}
        </CardTitle>
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: `${iconColor.replace(")", " / 0.12)")}` }}
        >
          <Icon className={cn("h-4 w-4", variantStyles[variant])} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div data-testid="kpi-value" className="text-[17px] md:text-[22px] font-bold leading-tight text-foreground truncate">{value}</div>
        
        <div className="flex items-center gap-1 md:gap-2 mt-1.5 min-h-[18px] overflow-hidden">
          {showTrend && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    data-testid="kpi-trend"
                    className={cn(
                      "inline-flex items-center gap-1 cursor-help text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      isUp
                        ? "bg-[hsl(158_64%_95%)] text-[hsl(158_64%_36%)]"
                        : "bg-[hsl(0_86%_97%)] text-[hsl(0_84%_50%)]"
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {formatTrendBadge(trend.percentage)}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-line text-left">
                  {formatTrendTooltip(trend, title)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {!showTrend && trend && !trend.hasPreviousData && (
            <span className="text-[10px] md:text-xs text-muted-foreground">Sem dados anteriores</span>
          )}
          
          {subtitle && (
            <span className="text-[10px] md:text-xs text-muted-foreground truncate min-w-0">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

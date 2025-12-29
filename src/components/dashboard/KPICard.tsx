import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
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
}

const variantStyles = {
  default: "text-primary",
  success: "text-emerald-500",
  warning: "text-yellow-500",
  danger: "text-destructive",
};

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "default",
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground truncate pr-2">
          {title}
        </CardTitle>
        <Icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4 shrink-0", variantStyles[variant])} />
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        <div className="text-base md:text-2xl font-bold text-foreground truncate">{value}</div>
        
        <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1 min-h-[18px]">
          {showTrend && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-help gap-0.5 md:gap-1 text-[10px] md:text-xs font-medium px-1.5 md:px-2",
                      getTrendColor()
                    )}
                  >
                    <TrendIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    {formatTrendBadge(trend.percentage)}
                  </Badge>
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
            <span className="text-[10px] md:text-xs text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

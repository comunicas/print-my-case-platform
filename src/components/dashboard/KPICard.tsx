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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6 pt-4 md:pt-6">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", variantStyles[variant])} />
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        <div className="text-lg md:text-2xl font-bold text-foreground">{value}</div>
        
        <div className="flex items-center gap-2 mt-1">
          {showTrend && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-help gap-1 text-xs font-medium",
                      getTrendColor()
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {formatTrendBadge(trend.percentage)}
                    <Info className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-line text-left">
                  {formatTrendTooltip(trend, title)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {!showTrend && trend && !trend.hasPreviousData && (
            <span className="text-xs text-muted-foreground">Sem dados anteriores</span>
          )}
          
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

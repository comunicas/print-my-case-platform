import { ReactNode } from "react";
import { Download, LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        {onExport && (
          <Button data-testid={exportTestId} variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {children}
      </CardContent>
    </Card>
  );
}

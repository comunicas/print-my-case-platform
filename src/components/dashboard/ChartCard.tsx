import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
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
  headerBadge,
  children,
  testId,
  className,
  animationDelay = 0,
}: ChartCardProps) {
  return (
    <Card 
      data-testid={testId} 
      className={cn(
        "flex flex-col animate-fade-in-up shadow-none transition-shadow hover:shadow-[0_4px_20px_hsl(var(--primary)/0.08)]",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
    >
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-[14.5px] font-bold">
            <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
            <span className="min-w-0 break-words">{title}</span>
          </CardTitle>
          <CardDescription className="text-[12px] text-muted-foreground">{description}</CardDescription>
        </div>
        {headerBadge && (
          <div className="flex items-center md:justify-end shrink-0">
            {headerBadge}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {children}
      </CardContent>
    </Card>
  );
}

import { LucideIcon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
  minHeight?: string;
  testId?: string;
}

export function ChartEmptyState({ 
  icon: Icon = BarChart3,
  title = "Sem dados",
  description = "Nenhum dado disponível para exibição",
  className,
  minHeight = "min-h-[250px]",
  testId,
}: ChartEmptyStateProps) {
  return (
    <div 
      data-testid={testId}
      className={cn(
        "flex-1 flex flex-col items-center justify-center text-center px-4",
        minHeight,
        className
      )}
    >
      <Icon className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
          {description}
        </p>
      )}
    </div>
  );
}

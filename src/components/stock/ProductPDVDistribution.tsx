import { MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { pluralize } from '@/lib/utils';

interface PDVSales {
  pdvId: string;
  pdvName: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface ProductPDVDistributionProps {
  data: PDVSales[];
  isLoading?: boolean;
}

export function ProductPDVDistribution({ data, isLoading }: ProductPDVDistributionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-2 w-full bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Distribuição por PDV</span>
        </div>
        <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
          Sem dados de distribuição
        </div>
      </div>
    );
  }

  // Mostrar apenas os top 5 PDVs
  const topPDVs = data.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Distribuição por PDV</span>
      </div>
      
      <div className="space-y-3">
        {topPDVs.map((pdv, index) => (
          <div key={pdv.pdvId} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate max-w-[60%]" title={pdv.pdvName}>
                {pdv.pdvName}
              </span>
              <span className="text-muted-foreground">
                {pluralize(pdv.count, 'venda', 'vendas')} ({pdv.percentage.toFixed(0)}%)
              </span>
            </div>
            <Progress 
              value={pdv.percentage} 
              className="h-1.5"
            />
          </div>
        ))}
        
        {data.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            +{data.length - 5} outros PDVs
          </p>
        )}
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, RotateCcw, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LossAnalysisCardProps {
  totalCancellations: number;
  cancelledTransactions: number;
  totalRefunds: number;
  refundedTransactions: number;
}

export function LossAnalysisCard({
  totalCancellations,
  cancelledTransactions,
  totalRefunds,
  refundedTransactions,
}: LossAnalysisCardProps) {
  const totalLosses = totalCancellations + totalRefunds;
  
  // Don't render if no losses
  if (totalLosses === 0) return null;
  
  const cancellationsPercentage = totalLosses > 0 
    ? (totalCancellations / totalLosses) * 100 
    : 0;
  const refundsPercentage = totalLosses > 0 
    ? (totalRefunds / totalLosses) * 100 
    : 0;

  return (
    <Card data-testid="loss-analysis-card">
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <TrendingDown className="h-5 w-5 text-muted-foreground" />
          Análise de Perdas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
        {/* Visual Bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-muted">
          {cancellationsPercentage > 0 && (
            <div 
              className="h-full bg-warning transition-all"
              style={{ width: `${cancellationsPercentage}%` }}
              title={`Cancelamentos: ${cancellationsPercentage.toFixed(1)}%`}
            />
          )}
          {refundsPercentage > 0 && (
            <div 
              className="h-full bg-destructive transition-all"
              style={{ width: `${refundsPercentage}%` }}
              title={`Reembolsos: ${refundsPercentage.toFixed(1)}%`}
            />
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {/* Cancellations */}
          <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="p-1.5 md:p-2 rounded-full bg-warning/20">
              <Ban className="h-3.5 w-3.5 md:h-4 md:w-4 text-warning" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Cancelamentos</p>
              <p className="text-base md:text-lg font-bold text-foreground">{formatCurrency(totalCancellations)}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {cancelledTransactions} desistências ({cancellationsPercentage.toFixed(0)}%)
              </p>
            </div>
          </div>

          {/* Refunds */}
          <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="p-1.5 md:p-2 rounded-full bg-destructive/20">
              <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-muted-foreground">Reembolsos</p>
              <p className="text-base md:text-lg font-bold text-foreground">{formatCurrency(totalRefunds)}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {refundedTransactions} devoluções ({refundsPercentage.toFixed(0)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total de Perdas Potenciais</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(totalLosses)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { CreditCard } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PaymentMethod {
  method: string;
  count: number;
  percentage: number;
}

interface ProductPaymentMethodsProps {
  data: PaymentMethod[];
  isLoading?: boolean;
}

const METHOD_LABELS: Record<string, string> = {
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'pix': 'PIX',
  'cash': 'Dinheiro',
  'Não informado': 'Não informado',
};

export function ProductPaymentMethods({ data, isLoading }: ProductPaymentMethodsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
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
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Métodos de Pagamento</span>
        </div>
        <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
          Sem dados de pagamento
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Métodos de Pagamento</span>
      </div>
      
      <div className="space-y-3">
        {data.map((method) => (
          <div key={method.method} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate max-w-[60%]">
                {METHOD_LABELS[method.method] || method.method}
              </span>
              <span className="text-muted-foreground">
                {method.count} ({method.percentage.toFixed(0)}%)
              </span>
            </div>
            <Progress 
              value={method.percentage} 
              className="h-1.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

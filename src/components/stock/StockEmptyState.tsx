import { Package } from 'lucide-react';

interface StockEmptyStateProps {
  message?: string;
  description?: string;
}

export function StockEmptyState({ 
  message = "Nenhum dado de estoque encontrado",
  description = "Faça upload de uma planilha de estoque para começar a visualizar seus dados."
}: StockEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{message}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        {description}
      </p>
    </div>
  );
}

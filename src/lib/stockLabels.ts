import { ProductStatus, SalesIndex } from './stockUtils';

// Labels para status de produto
export const statusLabels: Record<ProductStatus, string> = {
  ok: 'Ok',
  redistribute: 'Redistribuir',
  restock: 'Repor!',
};

export const statusColors: Record<ProductStatus, string> = {
  ok: 'bg-green-500/10 text-green-600 border-green-500/20',
  redistribute: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  restock: 'bg-destructive/10 text-destructive border-destructive/20',
};

// Labels para status de slot
export const slotStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  full: { label: 'Cheio', variant: 'default' },
  medium: { label: 'Médio', variant: 'secondary' },
  low: { label: 'Baixo', variant: 'outline' },
  critical: { label: 'Crítico', variant: 'destructive' },
  empty: { label: 'Vazio', variant: 'destructive' },
  inactive: { label: 'Inativo', variant: 'outline' },
};

// Labels para índice de vendas
export const salesIndexLabels: Record<SalesIndex, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
  none: 'Nenhuma',
};

export const salesIndexColors: Record<SalesIndex, string> = {
  high: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  low: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  none: 'bg-muted text-muted-foreground border-border',
};

// Variantes de badge para vendas (usado em ProductDetailModal)
export const salesBadgeVariants: Record<SalesIndex, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
  none: 'outline',
};

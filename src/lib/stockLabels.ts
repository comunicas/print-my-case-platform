import type { ProductActionStatus, SlotVisualStatus, SalesIndex } from './stockTypes';

/**
 * Labels e cores para status de ação de produto
 */
export const productActionLabels: Record<ProductActionStatus, string> = {
  ok: 'Ok',
  redistribute: 'Redistribuir',
  restock: 'Repor!',
};

export const productActionColors: Record<ProductActionStatus, string> = {
  ok: 'bg-green-500/10 text-green-600 border-green-500/20',
  redistribute: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  restock: 'bg-destructive/10 text-destructive border-destructive/20',
};

/**
 * Labels e variantes de badge para status visual de slot
 */
export const slotVisualLabels: Record<SlotVisualStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  full: { label: 'Cheio', variant: 'default' },
  medium: { label: 'Médio', variant: 'secondary' },
  low: { label: 'Baixo', variant: 'outline' },
  critical: { label: 'Crítico', variant: 'destructive' },
  empty: { label: 'Vazio', variant: 'destructive' },
  inactive: { label: 'Inativo', variant: 'outline' },
};

/**
 * Cores de blocos para visualização de slots
 * Mapeamento de status visual para classe de cor
 */
export const slotBlockColors: Record<SlotVisualStatus, string> = {
  full: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-yellow-500',
  critical: 'bg-orange-500',
  empty: 'bg-destructive',
  inactive: 'bg-muted',
};

/**
 * Labels para índice de vendas
 */
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

/**
 * Variantes de badge para vendas (usado em ProductDetailModal)
 */
export const salesBadgeVariants: Record<SalesIndex, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
  none: 'outline',
};

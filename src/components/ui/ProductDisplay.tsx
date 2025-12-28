import { BrandLogo } from './BrandLogo';
import { cn } from '@/lib/utils';

interface ProductDisplayProps {
  brand: string;
  model: string;
  logoSize?: 'xs' | 'sm' | 'md' | 'lg';
  layout?: 'inline' | 'stacked';
  className?: string;
  showBrandTooltip?: boolean;
}

export function ProductDisplay({ 
  brand, 
  model, 
  logoSize = 'sm',
  layout = 'inline',
  className,
  showBrandTooltip = true,
}: ProductDisplayProps) {
  if (layout === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <BrandLogo brand={brand} size={logoSize} showTooltip={showBrandTooltip} />
        <span className="text-xs text-muted-foreground text-center line-clamp-2">{model}</span>
      </div>
    );
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <BrandLogo brand={brand} size={logoSize} showTooltip={showBrandTooltip} />
      <span className="truncate">{model}</span>
    </div>
  );
}

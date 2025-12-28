import { getBrandLogo, getBrandColor, getCanonicalBrand } from '@/lib/brandAssets';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  brand: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const fontSizeClasses = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export function BrandLogo({ brand, size = 'md', showTooltip = true, className }: BrandLogoProps) {
  const canonical = getCanonicalBrand(brand);
  const logo = getBrandLogo(brand);
  const color = getBrandColor(brand);
  
  const content = logo ? (
    <img 
      src={logo} 
      alt={canonical}
      className={cn(sizeClasses[size], 'object-contain', className)}
    />
  ) : (
    <div 
      className={cn(
        sizeClasses[size],
        fontSizeClasses[size],
        'rounded-full flex items-center justify-center font-bold text-white',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {canonical.charAt(0)}
    </div>
  );
  
  if (!showTooltip) {
    return content;
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{content}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{canonical}</p>
      </TooltipContent>
    </Tooltip>
  );
}

import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MAX_CAPACITY, getBlockColorClass } from '@/lib/stockGridUtils';

interface SlotStackProps {
  slot: string;
  brand: string;
  model: string;
  quantity: number;
  isActive?: boolean;
  isHighlighted?: boolean;
  isFiltered?: boolean;
  onClick?: () => void;
}

export function SlotStack({
  slot,
  brand,
  model,
  quantity,
  isActive = true,
  isHighlighted = false,
  isFiltered = false,
  onClick,
}: SlotStackProps) {
  const blocks = Array.from({ length: MAX_CAPACITY }, (_, i) => i);
  
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={onClick}
          className={cn(
            'flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-lg cursor-pointer transition-all',
            'w-12 sm:w-14 md:w-16',
            'hover:scale-105 hover:shadow-md hover:bg-muted/50',
            isHighlighted && 'ring-2 ring-primary bg-primary/5',
            isFiltered && 'opacity-30',
            !isActive && 'opacity-50'
          )}
        >
          {/* Logo da marca no topo */}
          <div className="mb-0.5">
            <BrandLogo brand={brand} size="xs" showTooltip={false} />
          </div>
          
          {/* Blocos empilhados */}
          <div className="flex flex-col-reverse gap-px sm:gap-0.5">
            {blocks.map((index) => (
              <div
                key={index}
                className={cn(
                  'w-7 sm:w-8 md:w-10 h-1.5 sm:h-2 rounded-sm transition-colors',
                  getBlockColorClass(index, quantity, isActive)
                )}
              />
            ))}
          </div>
          
          {/* Número do slot */}
          <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold mt-0.5">
            {slot}
          </span>
          
          {/* Nome do modelo */}
          <span className="text-[6px] sm:text-[8px] text-muted-foreground/70 font-medium leading-tight text-center w-full line-clamp-2 break-words min-h-[1.5em] sm:min-h-[2em]">
            {model}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <div className="flex items-center gap-2">
          <BrandLogo brand={brand} size="sm" showTooltip={false} />
          <div>
            <p className="font-medium">{model}</p>
            <p className="text-xs text-muted-foreground">
              Slot {slot} • {quantity}/{MAX_CAPACITY} {quantity === 1 ? 'unidade' : 'unidades'}
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Componente para slot vazio (sem produto)
export function EmptySlot() {
  return (
    <div className="w-12 sm:w-14 md:w-16 h-[70px] sm:h-[85px] md:h-[100px]" />
  );
}

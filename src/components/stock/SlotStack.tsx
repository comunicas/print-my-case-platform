import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MAX_CAPACITY, getBlockColorClass, getSlotBorderClass } from '@/lib/stockGridUtils';

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
  // Cria array de blocos de baixo para cima (índice 0 = base)
  const blocks = Array.from({ length: MAX_CAPACITY }, (_, i) => i);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={onClick}
          className={cn(
            'flex flex-col items-center gap-0.5 p-1 rounded-md cursor-pointer transition-all',
            'hover:scale-105 hover:shadow-md',
            isHighlighted && 'ring-2 ring-primary',
            isFiltered && 'opacity-30',
            !isActive && 'opacity-50'
          )}
        >
          {/* Logo da marca no topo */}
          <div className="mb-1">
            <BrandLogo brand={brand} size="xs" showTooltip={false} />
          </div>
          
          {/* Blocos empilhados (de cima para baixo visualmente) */}
          <div className="flex flex-col-reverse gap-0.5">
            {blocks.map((index) => (
              <div
                key={index}
                className={cn(
                  'w-6 h-2 rounded-sm transition-colors',
                  getBlockColorClass(index, quantity, isActive)
                )}
              />
            ))}
          </div>
          
          {/* Número do slot */}
          <span className="text-[10px] text-muted-foreground font-medium mt-1">
            {slot}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <div className="flex items-center gap-2">
          <BrandLogo brand={brand} size="sm" showTooltip={false} />
          <div>
            <p className="font-medium">{model}</p>
            <p className="text-xs text-muted-foreground">
              Slot {slot} • {quantity}/{MAX_CAPACITY} unidades
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
    <div className="w-8 h-[60px]" /> // Espaço vazio mantendo layout
  );
}

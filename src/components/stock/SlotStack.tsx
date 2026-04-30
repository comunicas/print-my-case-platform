import React from 'react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MAX_CAPACITY, getBlockColorClass, getQuantityBadgeColor } from '@/lib/stockGridUtils';
import { SLOT_DIMENSIONS, StockViewMode } from '@/lib/stockViewModes';
import type { SlotData } from '@/lib/stockUtils';

interface AggregateInfo {
  totalQty: number;
  totalCapacity: number;
  slotCount: number;
}

interface SlotStackProps {
  slot: string;
  brand: string;
  model: string;
  quantity: number;
  isActive?: boolean;
  isHighlighted?: boolean;
  isFiltered?: boolean;
  isFocused?: boolean;
  viewMode?: StockViewMode;
  aggregateInfo?: AggregateInfo;
  slotData?: SlotData;
  onSlotClick?: (data: SlotData) => void;
}

export const SlotStack = React.memo(function SlotStack({
  slot,
  brand,
  model,
  quantity,
  isActive = true,
  isHighlighted = false,
  isFiltered = false,
  isFocused = false,
  viewMode = 'expanded',
  aggregateInfo,
  slotData,
  onSlotClick,
}: SlotStackProps) {
  const handleClick = React.useCallback(() => {
    if (slotData && onSlotClick) {
      onSlotClick(slotData);
    }
  }, [slotData, onSlotClick]);
  const blocks = Array.from({ length: MAX_CAPACITY }, (_, i) => i);
  const dimensions = SLOT_DIMENSIONS[viewMode];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={handleClick}
          className={cn(
            'relative flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-lg cursor-pointer',
            'transition-all duration-300 ease-out',
            dimensions.slot,
            'group hover:scale-105 hover:shadow-md hover:bg-muted/50',
            isHighlighted && 'ring-2 ring-primary bg-primary/5',
            isFocused && 'ring-2 ring-primary bg-primary/10 shadow-lg scale-105',
            isFiltered && 'opacity-30 scale-[0.98]',
            !isActive && 'opacity-50'
          )}
        >
          {/* Badge xN para modelos em múltiplos slots */}
          {aggregateInfo && (
            <span className="absolute -top-1 -right-1 text-[7px] sm:text-[8px] font-bold bg-muted text-muted-foreground rounded-full px-1 leading-normal z-10">
              x{aggregateInfo.slotCount}
            </span>
          )}
          
          {/* Logo da marca no topo */}
          <div className="mb-0.5">
            <BrandLogo brand={brand} size="xs" showTooltip={false} />
          </div>
          
          {/* Blocos empilhados */}
          <div className="flex flex-col-reverse gap-px sm:gap-0.5">
            {blocks.map((index) => (
              <div
                key={index}
                style={{ transitionDelay: `${index * 25}ms` }}
                className={cn(
                  'rounded-sm transition-all duration-200',
                  dimensions.block,
                  getBlockColorClass(index, quantity, isActive)
                )}
              />
            ))}
          </div>
          
          {/* Badge de quantidade */}
          <span className={cn(
            'font-bold text-white rounded-full px-1 leading-normal transition-opacity duration-200',
            viewMode === 'compact'
              ? 'text-[7px] sm:text-[8px] opacity-100'
              : 'text-[8px] sm:text-[9px] opacity-0 group-hover:opacity-100',
            getQuantityBadgeColor(quantity, isActive)
          )}>
            {quantity}/{MAX_CAPACITY}
          </span>

          {/* Número do slot */}
          <span className={cn(
            'text-muted-foreground font-semibold mt-0.5',
            dimensions.fontSize.slot
          )}>
            {slot}
          </span>
          
          {/* Nome do modelo */}
          <span className={cn(
            'text-muted-foreground/70 font-medium leading-tight text-center w-full break-words',
            dimensions.fontSize.model,
            viewMode === 'compact' ? 'line-clamp-1' : 'line-clamp-2',
            viewMode === 'compact' ? 'min-h-[1em]' : 'min-h-[1.5em] sm:min-h-[2em]'
          )}>
            {model}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <div className="flex items-center gap-2">
          <BrandLogo brand={brand} size="sm" showTooltip={false} />
          <div>
            <p className="font-medium">{model}</p>
            <p className="text-xs text-muted-foreground">
              Slot {slot} • {quantity}/{MAX_CAPACITY} {quantity === 1 ? 'unidade' : 'unidades'}
            </p>
          </div>
        </div>
        {aggregateInfo && (
          <>
            <div className="border-t border-border my-1.5" />
            <p className="text-xs text-muted-foreground">
              Total: {aggregateInfo.totalQty}/{aggregateInfo.totalCapacity} em {aggregateInfo.slotCount} slots
            </p>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
});

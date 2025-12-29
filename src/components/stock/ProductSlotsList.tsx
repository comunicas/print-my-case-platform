import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SlotData } from '@/lib/stockUtils';
import { MAX_CAPACITY, getBlockColorClass } from '@/lib/stockGridUtils';
import { statusLabels, statusColors } from '@/lib/stockLabels';
import { cn } from '@/lib/utils';

interface ProductSlotsListProps {
  slots: SlotData[];
  status: 'ok' | 'redistribute' | 'restock';
  isLoading?: boolean;
}

export function ProductSlotsList({ slots, status, isLoading }: ProductSlotsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Geral */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Status Geral</p>
          <p className="font-medium">{slots.length} slots ativos</p>
        </div>
        <Badge variant="outline" className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      </div>

      {/* Lista de Slots */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Slots com este produto
        </h4>
        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
          {slots
            .sort((a, b) => a.slot.localeCompare(b.slot, undefined, { numeric: true }))
            .map((slot) => {
              return (
                <div 
                  key={slot.id}
                  className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg"
                >
                  {/* Número do slot */}
                  <div className="w-12 text-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Slot {slot.slot}
                    </span>
                  </div>
                  
                  {/* PDV */}
                  {slot.pdvName && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{slot.pdvName}</p>
                    </div>
                  )}
                  
                  {/* Visualização de estoque */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: MAX_CAPACITY }).map((_, index) => {
                      const blockIndex = MAX_CAPACITY - 1 - index;
                      const isFilled = blockIndex < slot.quantity;
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            'w-3 h-5 rounded-sm',
                            isFilled 
                              ? getBlockColorClass(blockIndex, slot.quantity, slot.isActive)
                              : 'bg-muted/30'
                          )}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Quantidade */}
                  <div className="w-16 text-right">
                    <span className="text-sm font-medium">{slot.quantity}/{MAX_CAPACITY}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

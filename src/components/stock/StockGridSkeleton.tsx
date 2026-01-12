import { cn } from '@/lib/utils';
import { GRID_LAYOUT, COLUMN_HEADERS } from '@/lib/stockGridUtils';
import { SLOT_DIMENSIONS, StockViewMode } from '@/lib/stockViewModes';
import { Skeleton } from '@/components/ui/skeleton';

interface StockGridSkeletonProps {
  viewMode?: StockViewMode;
}

function SlotSkeleton({ viewMode, delay }: { viewMode: StockViewMode; delay: number }) {
  const dimensions = SLOT_DIMENSIONS[viewMode];
  const blocks = Array.from({ length: 10 }, (_, i) => i);
  
  return (
    <div 
      className={cn(
        'flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-lg animate-fade-in',
        dimensions.slot
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Logo skeleton */}
      <Skeleton className="h-4 w-4 rounded-full mb-0.5" />
      
      {/* Blocos skeleton com shimmer */}
      <div className="flex flex-col-reverse gap-px sm:gap-0.5">
        {blocks.map((index) => (
          <Skeleton
            key={index}
            className={cn('rounded-sm', dimensions.block)}
            style={{ animationDelay: `${index * 30}ms` }}
          />
        ))}
      </div>
      
      {/* Número do slot skeleton */}
      <Skeleton className="h-3 w-6 mt-0.5" />
      
      {/* Nome do modelo skeleton */}
      <Skeleton className={cn(
        "w-full",
        viewMode === 'compact' ? 'h-3' : 'h-5'
      )} />
    </div>
  );
}

export function StockGridSkeleton({ viewMode = 'expanded' }: StockGridSkeletonProps) {
  const dimensions = SLOT_DIMENSIONS[viewMode];
  
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-10" />
      </div>

      {/* Grid skeleton */}
      <div className="overflow-x-auto pb-4">
        <div className="flex justify-center min-w-fit">
          <div className="inline-block">
            {/* Cabeçalho de colunas */}
            <div className="flex items-center mb-2 sm:mb-3 pl-6 sm:pl-8 md:pl-10">
              {COLUMN_HEADERS.map((col) => (
                <div key={col} className={cn(dimensions.container, "flex justify-center")}>
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>

            {/* Linhas (andares) */}
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              {GRID_LAYOUT.map((floor, floorIndex) => (
                <div key={floor.floor} className="flex items-start">
                  {/* Label do andar */}
                  <div className="w-6 sm:w-8 md:w-10 flex justify-end pr-1.5 sm:pr-2 md:pr-3 pt-4 sm:pt-5 md:pt-6">
                    <Skeleton className="h-4 w-4" />
                  </div>
                  
                  {/* Slots skeleton */}
                  <div className="flex">
                    {floor.slots.map((slotNumber, colIndex) => {
                      if (slotNumber === null) {
                        return <div key={`empty-${colIndex}`} className={cn(dimensions.container, dimensions.height)} />;
                      }
                      
                      return (
                        <div key={slotNumber} className={cn(dimensions.container, "flex items-center justify-center")}>
                          <SlotSkeleton 
                            viewMode={viewMode} 
                            delay={(floorIndex * 9 + colIndex) * 20} 
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda skeleton */}
      <div className="flex flex-wrap justify-center gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
    </div>
  );
}

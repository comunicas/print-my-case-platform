import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { SlotData } from '@/lib/stockUtils';
import { getSlotVisualStatus, MAX_CAPACITY, getBlockColorClass } from '@/lib/stockGridUtils';
import { slotVisualLabels } from '@/lib/stockLabels';
import { cn } from '@/lib/utils';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProductModal } from '@/contexts/ProductModalContext';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { getExactProductKey } from '@/lib/productNormalization';

interface SlotDetailModalProps {
  slot: SlotData | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

export function SlotDetailModal({ 
  slot, 
  isOpen, 
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false,
}: SlotDetailModalProps) {
  const { openProductModal } = useProductModal();
  const { selectedPdv } = useStockFilters();
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  // Keyboard navigation dentro da modal
  useEffect(() => {
    if (!isOpen || !onNavigate) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canNavigatePrev) {
        e.preventDefault();
        setSlideDirection('right');
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && canNavigateNext) {
        e.preventDefault();
        setSlideDirection('left');
        onNavigate('next');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, canNavigatePrev, canNavigateNext]);

  // Reset slide animation after transition
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), 200);
      return () => clearTimeout(timer);
    }
  }, [slideDirection, slot]);
  
  if (!slot) return null;

  const status = getSlotVisualStatus(slot.quantity, slot.isActive);
  const statusInfo = slotVisualLabels[status] || slotVisualLabels.medium;
  const percentage = Math.round((slot.quantity / MAX_CAPACITY) * 100);

  const handleViewProduct = () => {
    if (slot.productName) {
      onClose();
      // Usar productKey normalizado para consistência com ProductDetailModal
      openProductModal(getExactProductKey(slot.productName), selectedPdv !== 'all' ? selectedPdv : undefined);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BrandLogo brand={slot.brand} size="md" />
            <span>{slot.model || slot.productName}</span>
          </DialogTitle>
          <DialogDescription>
            Detalhes do slot e estoque atual
          </DialogDescription>
        </DialogHeader>

        <div className={cn(
          "space-y-6 transition-all duration-200",
          slideDirection === 'left' && 'animate-slide-in-left',
          slideDirection === 'right' && 'animate-slide-in-right'
        )}>
          {/* Informações do Slot */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Slot</p>
              <p className="text-lg font-semibold">{slot.slot}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={slot.isActive ? 'default' : 'outline'} className="mt-1">
                {slot.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {slot.pdvName && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">PDV</p>
                <p className="font-medium">{slot.pdvName}</p>
              </div>
            )}
          </div>

          {/* Visualização de Estoque */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Estoque</p>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            
            {/* Barra visual de blocos */}
            <div className="flex gap-1 justify-center">
              {Array.from({ length: MAX_CAPACITY }).map((_, index) => {
                const blockIndex = MAX_CAPACITY - 1 - index;
                const isFilled = blockIndex < slot.quantity;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      'w-8 h-8 rounded-sm transition-colors',
                      isFilled 
                        ? getBlockColorClass(blockIndex, slot.quantity, slot.isActive)
                        : 'bg-muted/30 border border-dashed border-muted-foreground/30'
                    )}
                  />
                );
              })}
            </div>

            {/* Quantidade e porcentagem */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {slot.quantity} de {MAX_CAPACITY} {slot.quantity === 1 ? 'unidade' : 'unidades'}
              </span>
              <span className="font-medium">{percentage}%</span>
            </div>

            {/* Barra de progresso */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all rounded-full',
                  slot.quantity === 0 && 'bg-destructive',
                  slot.quantity > 0 && slot.quantity <= 2 && 'bg-orange-500',
                  slot.quantity > 2 && slot.quantity <= 5 && 'bg-yellow-500',
                  slot.quantity > 5 && 'bg-green-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Produto completo */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Produto</p>
            <p className="font-medium">{slot.productName}</p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:gap-2">
          {/* Navegação entre slots */}
          {onNavigate && (
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSlideDirection('right');
                  onNavigate('prev');
                }}
                disabled={!canNavigatePrev}
                title="Slot anterior (←)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSlideDirection('left');
                  onNavigate('next');
                }}
                disabled={!canNavigateNext}
                title="Próximo slot (→)"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleViewProduct}>
              <Package className="h-4 w-4 mr-2" />
              Ver detalhes do produto
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

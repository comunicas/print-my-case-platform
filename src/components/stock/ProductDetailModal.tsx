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
import { MAX_CAPACITY, getBlockColorClass } from '@/lib/stockGridUtils';
import { statusLabels, statusColors } from '@/lib/stockLabels';
import { cn } from '@/lib/utils';
import { Package, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { ProductSalesHistoryChart } from './ProductSalesHistoryChart';
import { extractBrandFromProductName, extractModelFromProductName } from '@/lib/productNormalization';
import { usePDVs } from '@/hooks/usePDVs';

interface ProductDetailModalProps {
  productName: string | null;
  slots: SlotData[];
  isOpen: boolean;
  onClose: () => void;
  pdvId?: string;
}

export function ProductDetailModal({ productName, slots, isOpen, onClose, pdvId }: ProductDetailModalProps) {
  const { pdvs } = usePDVs();
  const pdvName = pdvId ? pdvs.find(p => p.id === pdvId)?.name : null;

  // Filtra e agrega dados do produto
  const productData = useMemo(() => {
    if (!productName) return null;
    
    const productSlots = slots.filter(s => s.productName === productName);
    if (productSlots.length === 0) return null;
    
    const brand = extractBrandFromProductName(productName);
    const model = extractModelFromProductName(productName);
    const totalQuantity = productSlots.reduce((sum, s) => sum + s.quantity, 0);
    const maxCapacity = productSlots.length * MAX_CAPACITY;
    const hasLowSlot = productSlots.some(s => s.quantity <= 2);
    const hasEmptySlot = productSlots.some(s => s.quantity === 0);
    
    // Determinar status
    let status: 'ok' | 'redistribute' | 'restock' = 'ok';
    if (hasEmptySlot || totalQuantity === 0) {
      status = 'restock';
    } else if (hasLowSlot) {
      status = 'redistribute';
    }
    
    return {
      brand,
      model,
      totalQuantity,
      maxCapacity,
      status,
      slots: productSlots,
    };
  }, [productName, slots]);

  if (!productData) return null;

  const percentage = Math.round((productData.totalQuantity / productData.maxCapacity) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BrandLogo brand={productData.brand} size="md" />
            <span>{productData.model}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span>Informações detalhadas do produto e histórico de vendas</span>
            {pdvName && (
              <Badge variant="secondary" className="w-fit mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                Filtrado por: {pdvName}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI de Estoque */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm">Estoque Total</span>
            </div>
            <p className="text-2xl font-bold">
              {productData.totalQuantity}
              <span className="text-sm font-normal text-muted-foreground">/{productData.maxCapacity}</span>
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div 
                className={cn(
                  'h-full transition-all rounded-full',
                  percentage <= 20 && 'bg-destructive',
                  percentage > 20 && percentage <= 50 && 'bg-orange-500',
                  percentage > 50 && percentage <= 70 && 'bg-yellow-500',
                  percentage > 70 && 'bg-green-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Histórico de Vendas */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <ProductSalesHistoryChart 
              productName={productName} 
              pdvId={pdvId}
            />
          </div>

          {/* Status Geral */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Status Geral</p>
              <p className="font-medium">{productData.slots.length} slots ativos</p>
            </div>
            <Badge variant="outline" className={statusColors[productData.status]}>
              {statusLabels[productData.status]}
            </Badge>
          </div>

          {/* Lista de Slots */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Slots com este produto
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {productData.slots
                .sort((a, b) => a.slot.localeCompare(b.slot, undefined, { numeric: true }))
                .map((slot) => {
                  const slotPercentage = Math.round((slot.quantity / MAX_CAPACITY) * 100);
                  
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

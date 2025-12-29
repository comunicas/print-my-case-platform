import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { SlotData } from '@/lib/stockUtils';
import { MAX_CAPACITY } from '@/lib/stockGridUtils';
import { cn } from '@/lib/utils';
import { Package, MapPin, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { ProductSalesHistoryChart } from './ProductSalesHistoryChart';
import { ProductAnalyticsKPIs } from './ProductAnalyticsKPIs';
import { ProductSalesByHourChart } from './ProductSalesByHourChart';
import { ProductSalesByDayChart } from './ProductSalesByDayChart';
import { ProductPDVDistribution } from './ProductPDVDistribution';
import { ProductPaymentMethods } from './ProductPaymentMethods';
import { ProductSlotsList } from './ProductSlotsList';
import { extractBrandFromProductName, extractModelFromProductName, getExactProductKey } from '@/lib/productNormalization';
import { usePDVs } from '@/hooks/usePDVs';
import { useProductAnalytics } from '@/hooks/useProductAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductDetailModalProps {
  productName: string | null;
  slots: SlotData[];
  isOpen: boolean;
  onClose: () => void;
  pdvId?: string;
  slotsLoading?: boolean;
}

// Skeleton loader para quando a modal está carregando
function ModalSkeleton() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </DialogTitle>
        <DialogDescription>
          <Skeleton className="h-4 w-64" />
        </DialogDescription>
      </DialogHeader>
      
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full rounded-lg mt-4" />
      
      {/* Content skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      
      {/* Chart skeleton */}
      <Skeleton className="h-[200px] w-full rounded-lg mt-4" />
    </>
  );
}

export function ProductDetailModal({ productName, slots, isOpen, onClose, pdvId, slotsLoading }: ProductDetailModalProps) {
  const { pdvs } = usePDVs();
  const pdvName = pdvId ? pdvs.find(p => p.id === pdvId)?.name : null;

  const { data: analytics, isLoading: analyticsLoading } = useProductAnalytics(productName, pdvId);

  // Filtra e agrega dados do produto usando productKey para comparação consistente
  const productData = useMemo(() => {
    if (!productName) return null;
    
    // Usa getExactProductKey para comparar - productName aqui é o productKey normalizado
    const productSlots = slots.filter(s => getExactProductKey(s.productName) === productName);
    if (productSlots.length === 0) return null;
    
    // Extrai brand e model do primeiro slot (dados originais)
    const firstSlot = productSlots[0];
    const brand = firstSlot.brand || extractBrandFromProductName(firstSlot.productName);
    const model = firstSlot.model || extractModelFromProductName(firstSlot.productName);
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

  // Mostra skeleton enquanto carrega os slots
  if (slotsLoading && isOpen && productName) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <ModalSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  // Produto não encontrado após carregar
  if (!productData && isOpen && productName && !slotsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              Produto não encontrado
            </DialogTitle>
            <DialogDescription>
              Não foi possível encontrar dados de estoque para este produto. 
              Verifique se você tem acesso ao PDV correspondente.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!productData) return null;

  const percentage = Math.round((productData.totalQuantity / productData.maxCapacity) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BrandLogo brand={productData.brand} size="md" />
            <span className="truncate">{productData.model}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            <span>Análises detalhadas e métricas de performance</span>
            {pdvName && (
              <Badge variant="secondary" className="w-fit mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                Filtrado por: {pdvName}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="resumo" className="text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="vendas" className="text-xs sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="horarios" className="text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Horários</span>
            </TabsTrigger>
            <TabsTrigger value="estoque" className="text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Estoque</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Resumo */}
          <TabsContent value="resumo" className="space-y-4 mt-4">
            <ProductAnalyticsKPIs
              totalSales={analytics?.totalSales || 0}
              totalRevenue={analytics?.totalRevenue || 0}
              averageTicket={analytics?.averageTicket || 0}
              stockPercentage={percentage}
              isLoading={analyticsLoading}
            />

            {/* Barra de estoque */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="text-sm">Estoque Total</span>
              </div>
              <p className="text-2xl font-bold">
                {productData.totalQuantity}
                <span className="text-sm font-normal text-muted-foreground">/{productData.maxCapacity}</span>
              </p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
          </TabsContent>

          {/* Aba Vendas */}
          <TabsContent value="vendas" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <ProductSalesByDayChart
                data={analytics?.salesByDayOfWeek || []}
                bestDay={analytics?.bestDay || null}
                isLoading={analyticsLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <ProductPDVDistribution
                  data={analytics?.salesByPDV || []}
                  isLoading={analyticsLoading}
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <ProductPaymentMethods
                  data={analytics?.paymentMethods || []}
                  isLoading={analyticsLoading}
                />
              </div>
            </div>
          </TabsContent>

          {/* Aba Horários */}
          <TabsContent value="horarios" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <ProductSalesByHourChart
                data={analytics?.salesByHour || []}
                peakHour={analytics?.peakHour || null}
                isLoading={analyticsLoading}
              />
            </div>

            {analytics?.peakHour && analytics.peakHour.count > 0 && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Dica:</span> O horário de pico de vendas é às{' '}
                  <strong>{String(analytics.peakHour.hour).padStart(2, '0')}h</strong>. 
                  Considere garantir estoque adequado neste período.
                </p>
              </div>
            )}

            {analytics?.bestDay && analytics.bestDay.count > 0 && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Insight:</span> O melhor dia para vendas é{' '}
                  <strong>{analytics.bestDay.dayName}</strong> com {analytics.bestDay.count} vendas.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Aba Estoque */}
          <TabsContent value="estoque" className="mt-4">
            <ProductSlotsList
              slots={productData.slots}
              status={productData.status}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlotStack, EmptySlot } from './SlotStack';
import { StockLegend } from './StockLegend';
import { SlotDetailModal } from './SlotDetailModal';
import { ProductDetailModal } from './ProductDetailModal';
import { SlotData } from '@/lib/stockUtils';
import { GRID_LAYOUT, COLUMN_HEADERS } from '@/lib/stockGridUtils';
import { KNOWN_BRANDS } from '@/lib/brandAssets';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { cn } from '@/lib/utils';

interface StockGridViewProps {
  slots: SlotData[];
  brands?: string[];
  isLoading?: boolean;
}

export function StockGridView({ slots, brands = KNOWN_BRANDS, isLoading }: StockGridViewProps) {
  const { searchTerm, brandFilter } = useStockFilters();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Mapeia slots por número para acesso rápido
  const slotMap = useMemo(() => {
    const map = new Map<string, SlotData>();
    for (const slot of slots) {
      map.set(slot.slot, slot);
    }
    return map;
  }, [slots]);

  // Filtra slots pelo termo de busca e marca (usando contexto global)
  const highlightedSlots = useMemo(() => {
    const highlighted = new Set<string>();
    const selectedBrand = brandFilter === 'all' ? null : brandFilter;
    
    if (!searchTerm && !selectedBrand) return highlighted;
    
    for (const slot of slots) {
      const matchesSearch = !searchTerm || 
        slot.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.productName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBrand = !selectedBrand || slot.brand === selectedBrand;
      
      if (matchesSearch && matchesBrand) {
        highlighted.add(slot.slot);
      }
    }
    
    return highlighted;
  }, [slots, searchTerm, brandFilter]);

  const hasFilter = searchTerm !== '' || brandFilter !== 'all';

  const handleSlotClick = (slotData: SlotData) => {
    setSelectedSlot(slotData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleViewProduct = (productName: string) => {
    setIsModalOpen(false);
    setSelectedProduct(productName);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  const gridContent = (
    <div className={cn(
      'space-y-4',
      isFullscreen && 'fixed inset-0 z-50 bg-background p-4 md:p-6 overflow-auto'
    )}>
      {/* Header com botão fullscreen */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Grid da máquina - com escala em mobile */}
      <div className="overflow-x-auto pb-4">
        <div className="flex justify-center min-w-fit">
          <div className="inline-block transform scale-[0.65] sm:scale-[0.8] md:scale-90 lg:scale-100 origin-top">
            {/* Cabeçalho de colunas */}
            <div className="flex items-center mb-3 pl-10">
              {COLUMN_HEADERS.map((col) => (
                <div key={col} className="w-[72px] text-center text-sm text-muted-foreground font-semibold">
                  {col}
                </div>
              ))}
            </div>

            {/* Linhas (andares) */}
            <div className="space-y-3">
              {GRID_LAYOUT.map((floor) => (
                <div key={floor.floor} className="flex items-start">
                  {/* Label do andar */}
                  <div className="w-10 text-sm text-muted-foreground font-semibold text-right pr-3 pt-6">
                    {floor.label}
                  </div>
                  
                  {/* Slots do andar */}
                  <div className="flex">
                    {floor.slots.map((slotNumber, colIndex) => {
                      if (slotNumber === null) {
                        return <div key={`empty-${colIndex}`} className="w-[72px] h-[100px]" />;
                      }
                      
                      const slotData = slotMap.get(slotNumber);
                      
                      if (!slotData) {
                        return (
                          <div key={slotNumber} className="w-[72px] flex items-center justify-center">
                            <div className="w-16 h-[100px] bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-1">
                              <div className="w-10 h-14 bg-muted/20 rounded" />
                              <span className="text-[10px] text-muted-foreground font-medium">{slotNumber}</span>
                            </div>
                          </div>
                        );
                      }
                      
                      const isHighlighted = hasFilter && highlightedSlots.has(slotNumber);
                      const isFiltered = hasFilter && !highlightedSlots.has(slotNumber);
                      
                      return (
                        <div key={slotNumber} className="w-[72px] flex items-center justify-center">
                          <SlotStack
                            slot={slotData.slot}
                            brand={slotData.brand}
                            model={slotData.model}
                            quantity={slotData.quantity}
                            isActive={slotData.isActive}
                            isHighlighted={isHighlighted}
                            isFiltered={isFiltered}
                            onClick={() => handleSlotClick(slotData)}
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

      {/* Legenda */}
      <StockLegend brands={brands} />

      {/* Modal de detalhes do slot */}
      <SlotDetailModal
        slot={selectedSlot}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onViewProduct={handleViewProduct}
      />

      {/* Modal de detalhes do produto */}
      <ProductDetailModal
        productName={selectedProduct}
        slots={slots}
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
      />
    </div>
  );

  return gridContent;
}

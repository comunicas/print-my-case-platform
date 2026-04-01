import { useState, useMemo, useEffect, useRef, useCallback, RefObject } from 'react';
import { Maximize2, X, Minimize2, Expand, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlotStack } from './SlotStack';
import { StockLegend } from './StockLegend';
import { SlotDetailModal } from './SlotDetailModal';
import { StockGridSkeleton } from './StockGridSkeleton';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { SlotData } from '@/lib/stockUtils';
import { GRID_LAYOUT, COLUMN_HEADERS } from '@/lib/stockGridUtils';
import { SLOT_DIMENSIONS, StockViewMode } from '@/lib/stockViewModes';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { KNOWN_BRANDS } from '@/lib/brandAssets';
import { getExactProductKey } from '@/lib/productNormalization';
import { getProductActionStatus } from '@/lib/stockUtils';
import { productActionLabels } from '@/lib/stockLabels';
import { MAX_CAPACITY } from '@/lib/stockGridUtils';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { useGridKeyboardNavigation, findNextSlot, getFirstSlot } from '@/hooks/useGridKeyboardNavigation';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface StockGridViewProps {
  slots: SlotData[];
  filteredSlots?: SlotData[];
  brands?: string[];
  isLoading?: boolean;
}

/** Groups slots by pdvId, returns sorted array of { pdvId, pdvName, slots } */
function groupSlotsByPdv(slots: SlotData[]) {
  const map = new Map<string, { pdvId: string; pdvName: string; slots: SlotData[] }>();
  for (const slot of slots) {
    if (!map.has(slot.pdvId)) {
      map.set(slot.pdvId, { pdvId: slot.pdvId, pdvName: slot.pdvName || slot.pdvId, slots: [] });
    }
    map.get(slot.pdvId)!.slots.push(slot);
  }
  return Array.from(map.values()).sort((a, b) => a.pdvName.localeCompare(b.pdvName));
}

const STORAGE_KEY = 'stock-view-mode';

const isValidViewMode = (v: unknown): v is StockViewMode => v === 'compact' || v === 'expanded';

export function StockGridView({ slots, filteredSlots, brands = KNOWN_BRANDS, isLoading }: StockGridViewProps) {
  const { searchTerm, brandFilter, statusFilter, salesIndexFilter, selectedPdv } = useStockFilters();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // View mode with useLocalStorageState
  const [viewMode, setViewMode] = useLocalStorageState<StockViewMode>(STORAGE_KEY, 'expanded', {
    deserialize: (raw) => {
      const parsed = JSON.parse(raw);
      return isValidViewMode(parsed) ? parsed : 'expanded';
    },
  });
  
  // Transition states for animations
  const [isViewModeTransitioning, setIsViewModeTransitioning] = useState(false);
  const [isPdvTransitioning, setIsPdvTransitioning] = useState(false);
  const prevViewModeRef = useRef(viewMode);
  const prevPdvRef = useRef(selectedPdv);
  
  useEffect(() => {
    // Animate view mode change
    if (prevViewModeRef.current !== viewMode) {
      setIsViewModeTransitioning(true);
      const timer = setTimeout(() => setIsViewModeTransitioning(false), 300);
      prevViewModeRef.current = viewMode;
      return () => clearTimeout(timer);
    }
  }, [viewMode]);
  
  // Animate PDV change
  useEffect(() => {
    if (prevPdvRef.current !== selectedPdv) {
      setIsPdvTransitioning(true);
      const timer = setTimeout(() => setIsPdvTransitioning(false), 350);
      prevPdvRef.current = selectedPdv;
      return () => clearTimeout(timer);
    }
  }, [selectedPdv]);
  
  const dimensions = SLOT_DIMENSIONS[viewMode];

  // Agrupa slots por PDV para renderização separada
  const pdvGroups = useMemo(() => groupSlotsByPdv(slots), [slots]);
  const isMultiPdv = pdvGroups.length > 1;

  // Mapeia slots por pdvId+slot para acesso rápido (evita colisão entre PDVs)
  const slotMap = useMemo(() => {
    const map = new Map<string, SlotData>();
    for (const slot of slots) {
      // Usa chave composta quando multi-PDV, simples quando único
      const key = isMultiPdv ? `${slot.pdvId}-${slot.slot}` : slot.slot;
      map.set(key, slot);
    }
    return map;
  }, [slots, isMultiPdv]);


  // Calcula totais agregados por modelo (para indicador multi-slot)
  const productTotals = useMemo(() => {
    const totals = new Map<string, { totalQty: number; totalCapacity: number; slotCount: number }>();
    for (const slot of slots) {
      const key = getExactProductKey(slot.model ? `${slot.brand} ${slot.model}` : slot.brand);
      const prev = totals.get(key) || { totalQty: 0, totalCapacity: 0, slotCount: 0 };
      totals.set(key, {
        totalQty: prev.totalQty + slot.quantity,
        totalCapacity: prev.totalCapacity + MAX_CAPACITY,
        slotCount: prev.slotCount + 1,
      });
    }
    return totals;
  }, [slots]);

  // Set de slots filtrados para verificação rápida (chave composta para multi-PDV)
  const filteredSlotKeys = useMemo(() => {
    if (!filteredSlots) return null;
    return new Set(filteredSlots.map(s => isMultiPdv ? `${s.pdvId}-${s.slot}` : s.slot));
  }, [filteredSlots, isMultiPdv]);

  const hasFilter = searchTerm !== '' || brandFilter !== 'all' || statusFilter !== 'all' || salesIndexFilter !== 'all';

  // Refs para scroll automático
  const slotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const registerSlotRef = useCallback((slotNumber: string, element: HTMLDivElement | null) => {
    if (element) {
      slotRefs.current.set(slotNumber, element);
    } else {
      slotRefs.current.delete(slotNumber);
    }
  }, []);

  const handleSlotClick = useCallback((slotData: SlotData) => {
    setSelectedSlot(slotData);
    setIsModalOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    const dataToExport = hasFilter && filteredSlots ? filteredSlots : slots;
    const sorted = [...dataToExport].sort((a, b) =>
      (a.pdvName || '').localeCompare(b.pdvName || '') || a.slot.localeCompare(b.slot)
    );

    const headers = ['PDV', 'Slot', 'Marca', 'Modelo', 'Quantidade', 'Capacidade', 'Status'];
    const rows = sorted.map(s => [
      s.pdvName || '',
      s.slot,
      s.brand,
      s.model || '',
      String(s.quantity),
      String(MAX_CAPACITY),
      productActionLabels[getProductActionStatus(s.quantity)],
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `estoque-mapa-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [slots, filteredSlots, hasFilter]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Não limpa selectedSlot para manter consistência com navegação
  }, []);

  // Navegação na modal com loop infinito
  const getAdjacentSlot = useCallback((currentSlot: string, direction: 'prev' | 'next'): string | null => {
    const navDirection = direction === 'prev' ? 'left' : 'right';
    return findNextSlot(currentSlot, navDirection, slotMap, true); // enableLoop = true
  }, [slotMap]);

  // Keyboard navigation
  const { focusedSlot, setFocusedSlot, showHelp, setShowHelp } = useGridKeyboardNavigation({
    slots: slotMap,
    viewMode,
    setViewMode,
    isFullscreen,
    setIsFullscreen,
    onSlotSelect: (slotNumber) => {
      const slotData = slotMap.get(slotNumber);
      if (slotData) handleSlotClick(slotData);
    },
    isModalOpen,
    slotRefs: slotRefs as RefObject<Map<string, HTMLDivElement>>,
  });

  const handleModalNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedSlot) return;
    
    const nextSlotNumber = getAdjacentSlot(selectedSlot.slot, direction);
    if (nextSlotNumber) {
      const nextSlotData = slotMap.get(nextSlotNumber);
      if (nextSlotData) {
        setSelectedSlot(nextSlotData);
        setFocusedSlot(nextSlotNumber);
      }
    }
  }, [selectedSlot, slotMap, getAdjacentSlot, setFocusedSlot]);

  // Com loop infinito, sempre pode navegar
  const canNavigatePrev = true;
  const canNavigateNext = true;

  // Swipe e haptic para navegação touch no grid principal
  const isMobile = useIsMobile();
  const { vibrate } = useHapticFeedback();
  
  const { handlers: gridSwipeHandlers, swipeOffset: gridSwipeOffset } = useSwipeGesture({
    onSwipeLeft: () => {
      if (!isModalOpen) {
        vibrate('navigation');
        const currentSlot = focusedSlot || getFirstSlot();
        const next = findNextSlot(currentSlot, 'right', slotMap, true);
        if (next) setFocusedSlot(next);
      }
    },
    onSwipeRight: () => {
      if (!isModalOpen) {
        vibrate('navigation');
        const currentSlot = focusedSlot || getFirstSlot();
        const next = findNextSlot(currentSlot, 'left', slotMap, true);
        if (next) setFocusedSlot(next);
      }
    },
    threshold: 60,
    enabled: isMobile && !isModalOpen,
  });

  if (isLoading) {
    return <StockGridSkeleton viewMode={viewMode} />;
  }

  const gridContent = (
    <div className={cn(
      'space-y-4',
      isFullscreen && 'fixed inset-0 z-50 bg-background p-4 md:p-6 overflow-auto',
      isPdvTransitioning && 'animate-content-swap'
    )}>
      {/* Header com toggles */}
      <div className="flex justify-end gap-2">
        {/* Ajuda de atalhos */}
        <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
        
        {/* Toggle compacto/expandido */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <Button 
            variant={viewMode === 'compact' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('compact')}
            className="rounded-none px-2 sm:px-3"
            title="Visualização compacta (C)"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Compacto</span>
          </Button>
          <Button 
            variant={viewMode === 'expanded' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('expanded')}
            className="rounded-none px-2 sm:px-3"
            title="Visualização expandida (E)"
          >
            <Expand className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Expandido</span>
          </Button>
        </div>
        
        {/* Botão fullscreen */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title="Tela cheia (F)"
        >
          {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Grid da máquina - responsivo */}
      <div 
        {...(isMobile ? gridSwipeHandlers : {})}
        className={cn(
          'overflow-x-auto pb-4 relative',
          isViewModeTransitioning && 'animate-scale-resize'
        )}
      >
        {/* Indicador de swipe no grid */}
        {isMobile && gridSwipeOffset !== 0 && (
          <div className={cn(
            "fixed top-1/2 -translate-y-1/2 z-40 transition-opacity pointer-events-none",
            gridSwipeOffset > 0 ? "left-4" : "right-4",
            Math.abs(gridSwipeOffset) > 40 ? "opacity-100" : "opacity-50"
          )}>
            <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
              {gridSwipeOffset > 0 ? (
                <ChevronLeft className="h-6 w-6 text-primary" />
              ) : (
                <ChevronRight className="h-6 w-6 text-primary" />
              )}
            </div>
          </div>
        )}
        
        {pdvGroups.map((group) => {
          // Cria slotMap local para este PDV
          const pdvSlotMap = new Map<string, SlotData>();
          for (const slot of group.slots) {
            pdvSlotMap.set(slot.slot, slot);
          }

          return (
            <div key={group.pdvId} className="mb-6 last:mb-0">
              {/* Título do PDV quando multi-PDV */}
              {isMultiPdv && (
                <h3 className="text-sm font-semibold text-foreground mb-3 pl-6 sm:pl-8 md:pl-10">
                  {group.pdvName}
                </h3>
              )}

              <div className="flex justify-center min-w-fit">
                <div className="inline-block">
                  {/* Cabeçalho de colunas */}
                  <div className="flex items-center mb-2 sm:mb-3 pl-6 sm:pl-8 md:pl-10">
                    {COLUMN_HEADERS.map((col) => (
                      <div key={col} className={cn(dimensions.container, "text-center text-xs sm:text-sm text-muted-foreground font-semibold")}>
                        {col}
                      </div>
                    ))}
                  </div>

                  {/* Linhas (andares) */}
                  <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                    {GRID_LAYOUT.map((floor) => (
                      <div key={floor.floor} className="flex items-start">
                        {/* Label do andar */}
                        <div className="w-6 sm:w-8 md:w-10 text-xs sm:text-sm text-muted-foreground font-semibold text-right pr-1.5 sm:pr-2 md:pr-3 pt-4 sm:pt-5 md:pt-6">
                          {floor.label}
                        </div>
                        
                        {/* Slots do andar */}
                        <div className="flex">
                          {floor.slots.map((slotNumber, colIndex) => {
                            if (slotNumber === null) {
                              return <div key={`empty-${colIndex}`} className={cn(dimensions.container, dimensions.height)} />;
                            }
                            
                            const slotData = pdvSlotMap.get(slotNumber);
                            
                            if (!slotData) {
                              return (
                                <div key={slotNumber} className={cn(dimensions.container, "flex items-center justify-center")}>
                                  <div className={cn(dimensions.slot, dimensions.height, "bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-1")}>
                                    <div className="w-7 sm:w-8 md:w-10 h-10 sm:h-12 md:h-14 bg-muted/20 rounded" />
                                    <span className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">{slotNumber}</span>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Verifica se o slot está nos slots filtrados
                            const slotKey = isMultiPdv ? `${slotData.pdvId}-${slotNumber}` : slotNumber;
                            const isInFilteredSlots = !filteredSlotKeys || filteredSlotKeys.has(slotKey);
                            const isHighlighted = hasFilter && isInFilteredSlots;
                            const isFiltered = hasFilter && !isInFilteredSlots;
                            const isFocused = focusedSlot === slotNumber;
                            
                            const productKey = getExactProductKey(slotData.model ? `${slotData.brand} ${slotData.model}` : slotData.brand);
                            const aggInfo = productTotals.get(productKey);
                            
                            return (
                              <div 
                                key={slotNumber} 
                                ref={(el) => registerSlotRef(isMultiPdv ? `${group.pdvId}-${slotNumber}` : slotNumber, el)}
                                className={cn(dimensions.container, "flex items-center justify-center")}
                              >
                                <SlotStack
                                  slot={slotData.slot}
                                  brand={slotData.brand}
                                  model={slotData.model}
                                  quantity={slotData.quantity}
                                  isActive={slotData.isActive}
                                  isHighlighted={isHighlighted}
                                  isFiltered={isFiltered}
                                  isFocused={isFocused}
                                  viewMode={viewMode}
                                  aggregateInfo={aggInfo && aggInfo.slotCount > 1 ? aggInfo : undefined}
                                  slotData={slotData}
                                  onSlotClick={handleSlotClick}
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
          );
        })}
      </div>

      {/* Legenda */}
      <StockLegend brands={brands} />

      {/* Modal de detalhes do slot */}
      <SlotDetailModal
        slot={selectedSlot}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onNavigate={handleModalNavigate}
        canNavigatePrev={canNavigatePrev}
        canNavigateNext={canNavigateNext}
      />
    </div>
  );

  return gridContent;
}

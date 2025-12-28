import { useState, useMemo } from 'react';
import { Search, Maximize2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SlotStack, EmptySlot } from './SlotStack';
import { StockLegend } from './StockLegend';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { SlotData } from '@/lib/stockUtils';
import { GRID_LAYOUT, COLUMN_HEADERS } from '@/lib/stockGridUtils';
import { KNOWN_BRANDS } from '@/lib/brandAssets';
import { cn } from '@/lib/utils';

interface StockGridViewProps {
  slots: SlotData[];
  brands?: string[];
  isLoading?: boolean;
}

export function StockGridView({ slots, brands = KNOWN_BRANDS, isLoading }: StockGridViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mapeia slots por número para acesso rápido
  const slotMap = useMemo(() => {
    const map = new Map<string, SlotData>();
    for (const slot of slots) {
      map.set(slot.slot, slot);
    }
    return map;
  }, [slots]);

  // Filtra slots pelo termo de busca e marca
  const highlightedSlots = useMemo(() => {
    const highlighted = new Set<string>();
    
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
  }, [slots, searchTerm, selectedBrand]);

  const hasFilter = searchTerm !== '' || selectedBrand !== null;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  const gridContent = (
    <div className={cn(
      'space-y-4',
      isFullscreen && 'fixed inset-0 z-50 bg-background p-6 overflow-auto'
    )}>
      {/* Header com filtros */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Filtro por marca (logos clicáveis) */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <Button
              variant={selectedBrand === null ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedBrand(null)}
              className="h-8 px-3 text-xs"
            >
              Todos
            </Button>
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={selectedBrand === brand ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                className="h-8 w-8 p-0"
              >
                <BrandLogo brand={brand} size="sm" showTooltip={false} />
              </Button>
            ))}
          </div>
          
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[180px] h-8"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {hasFilter && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setSearchTerm(''); setSelectedBrand(null); }}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Grid da máquina */}
      <div className="overflow-x-auto flex justify-center">
        <div className="inline-block">
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

      {/* Legenda */}
      <StockLegend brands={brands} />
    </div>
  );

  return gridContent;
}

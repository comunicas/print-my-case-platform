import { useEffect, useCallback, useState, RefObject } from 'react';
import { GRID_LAYOUT } from '@/lib/stockGridUtils';
import { StockViewMode } from '@/lib/stockViewModes';

interface UseGridKeyboardNavigationProps {
  slots: Map<string, unknown>;
  viewMode: StockViewMode;
  setViewMode: (mode: StockViewMode) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  onSlotSelect: (slotNumber: string) => void;
  isModalOpen: boolean;
  slotRefs?: RefObject<Map<string, HTMLDivElement> | null>;
}

interface GridPosition {
  floor: number;
  col: number;
}

// Cria mapa de posição para navegação
function buildNavigationMap() {
  const slotToPosition = new Map<string, GridPosition>();
  const positionToSlot = new Map<string, string>();
  
  GRID_LAYOUT.forEach((floor, floorIndex) => {
    floor.slots.forEach((slotNumber, colIndex) => {
      if (slotNumber !== null) {
        const pos = { floor: floorIndex, col: colIndex };
        slotToPosition.set(slotNumber, pos);
        positionToSlot.set(`${floorIndex}-${colIndex}`, slotNumber);
      }
    });
  });
  
  return { slotToPosition, positionToSlot };
}

const { slotToPosition, positionToSlot } = buildNavigationMap();

// Encontra o primeiro slot válido
function getFirstSlot(): string | null {
  for (const floor of GRID_LAYOUT) {
    for (const slot of floor.slots) {
      if (slot !== null) return slot;
    }
  }
  return null;
}

// Encontra próximo slot válido na direção especificada
export function findNextSlot(
  currentSlot: string,
  direction: 'up' | 'down' | 'left' | 'right',
  slots: Map<string, unknown>
): string | null {
  const currentPos = slotToPosition.get(currentSlot);
  if (!currentPos) return null;
  
  let { floor, col } = currentPos;
  const maxFloors = GRID_LAYOUT.length;
  const maxCols = 9; // Sempre 9 colunas
  
  // Calcula nova posição
  switch (direction) {
    case 'up':
      floor = Math.max(0, floor - 1);
      break;
    case 'down':
      floor = Math.min(maxFloors - 1, floor + 1);
      break;
    case 'left':
      col = Math.max(0, col - 1);
      break;
    case 'right':
      col = Math.min(maxCols - 1, col + 1);
      break;
  }
  
  // Tenta encontrar slot válido na nova posição
  const newSlot = positionToSlot.get(`${floor}-${col}`);
  if (newSlot && slots.has(newSlot)) {
    return newSlot;
  }
  
  // Se não encontrou, procura o mais próximo na direção
  if (direction === 'up' || direction === 'down') {
    // Procura na mesma coluna em andares adjacentes
    for (let offset = 1; offset < maxFloors; offset++) {
      const testFloor = direction === 'up' ? floor - offset : floor + offset;
      if (testFloor < 0 || testFloor >= maxFloors) break;
      
      const testSlot = positionToSlot.get(`${testFloor}-${col}`);
      if (testSlot && slots.has(testSlot)) {
        return testSlot;
      }
    }
  }
  
  return currentSlot; // Mantém posição atual se não encontrou
}

export function useGridKeyboardNavigation({
  slots,
  viewMode,
  setViewMode,
  isFullscreen,
  setIsFullscreen,
  onSlotSelect,
  isModalOpen,
  slotRefs,
}: UseGridKeyboardNavigationProps) {
  const [focusedSlot, setFocusedSlot] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Scroll automático quando o slot focado muda
  useEffect(() => {
    if (!focusedSlot || !slotRefs?.current) return;
    
    const slotElement = slotRefs.current.get(focusedSlot);
    if (!slotElement) return;
    
    slotElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [focusedSlot, slotRefs]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignora se estiver digitando em input ou modal aberto
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        isModalOpen) {
      return;
    }

    switch (e.key) {
      // Navegação por setas
      case 'ArrowUp':
        e.preventDefault();
        if (!focusedSlot) {
          setFocusedSlot(getFirstSlot());
        } else {
          const next = findNextSlot(focusedSlot, 'up', slots);
          if (next) setFocusedSlot(next);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (!focusedSlot) {
          setFocusedSlot(getFirstSlot());
        } else {
          const next = findNextSlot(focusedSlot, 'down', slots);
          if (next) setFocusedSlot(next);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (!focusedSlot) {
          setFocusedSlot(getFirstSlot());
        } else {
          const next = findNextSlot(focusedSlot, 'left', slots);
          if (next) setFocusedSlot(next);
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (!focusedSlot) {
          setFocusedSlot(getFirstSlot());
        } else {
          const next = findNextSlot(focusedSlot, 'right', slots);
          if (next) setFocusedSlot(next);
        }
        break;

      // Selecionar slot
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedSlot) {
          onSlotSelect(focusedSlot);
        }
        break;

      // Atalhos de visualização
      case 'c':
      case 'C':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setViewMode('compact');
        }
        break;
        
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setViewMode('expanded');
        }
        break;
        
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setIsFullscreen(!isFullscreen);
        }
        break;

      // Escape - sair do fullscreen ou limpar foco
      case 'Escape':
        e.preventDefault();
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (focusedSlot) {
          setFocusedSlot(null);
        }
        break;

      // Ajuda
      case '?':
        e.preventDefault();
        setShowHelp(prev => !prev);
        break;
    }
  }, [focusedSlot, slots, viewMode, setViewMode, isFullscreen, setIsFullscreen, onSlotSelect, isModalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Limpa foco quando modal fecha
  useEffect(() => {
    if (!isModalOpen && focusedSlot) {
      // Mantém o foco após fechar o modal
    }
  }, [isModalOpen]);

  return {
    focusedSlot,
    setFocusedSlot,
    showHelp,
    setShowHelp,
  };
}

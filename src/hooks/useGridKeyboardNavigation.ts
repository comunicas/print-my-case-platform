import { useEffect, useCallback, useState, RefObject } from 'react';
import { GRID_LAYOUT } from '@/lib/stockGridUtils';
import { StockViewMode } from '@/lib/stockViewModes';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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

// Encontra o primeiro slot válido (canto superior direito do grid visual)
export function getFirstSlot(): string {
  for (const floor of GRID_LAYOUT) {
    for (const slot of floor.slots) {
      if (slot !== null) return slot;
    }
  }
  return "91";
}

// Encontra o último slot válido (canto inferior esquerdo do grid visual)
export function getLastSlot(): string {
  for (let i = GRID_LAYOUT.length - 1; i >= 0; i--) {
    const floor = GRID_LAYOUT[i];
    for (let j = floor.slots.length - 1; j >= 0; j--) {
      if (floor.slots[j] !== null) return floor.slots[j]!;
    }
  }
  return "01";
}

// Encontra próximo slot válido na direção especificada
export function findNextSlot(
  currentSlot: string,
  direction: 'up' | 'down' | 'left' | 'right',
  slots: Map<string, unknown>,
  enableLoop: boolean = false
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
      col = col - 1;
      // Se saiu da coluna à esquerda, vai para última coluna da linha anterior
      if (col < 0) {
        col = maxCols - 1;
        floor = floor - 1;
        if (floor < 0) {
          if (enableLoop) {
            floor = maxFloors - 1;
          } else {
            return currentSlot;
          }
        }
      }
      break;
    case 'right':
      col = col + 1;
      // Se saiu da coluna à direita, vai para primeira coluna da próxima linha
      if (col >= maxCols) {
        col = 0;
        floor = floor + 1;
        if (floor >= maxFloors) {
          if (enableLoop) {
            floor = 0;
          } else {
            return currentSlot;
          }
        }
      }
      break;
  }
  
  // Tenta encontrar slot válido na nova posição
  const newSlot = positionToSlot.get(`${floor}-${col}`);
  if (newSlot && slots.has(newSlot)) {
    return newSlot;
  }
  
  // Para navegação horizontal, continua procurando até encontrar slot válido
  // (necessário para a linha 1 que tem slots null)
  if (direction === 'left' || direction === 'right') {
    let attempts = 0;
    while (attempts < maxFloors * maxCols) {
      if (direction === 'right') {
        col++;
        if (col >= maxCols) {
          col = 0;
          floor++;
          if (floor >= maxFloors) {
            floor = enableLoop ? 0 : maxFloors - 1;
            if (!enableLoop) return currentSlot;
          }
        }
      } else {
        col--;
        if (col < 0) {
          col = maxCols - 1;
          floor--;
          if (floor < 0) {
            floor = enableLoop ? maxFloors - 1 : 0;
            if (!enableLoop) return currentSlot;
          }
        }
      }
      
      const testSlot = positionToSlot.get(`${floor}-${col}`);
      if (testSlot && slots.has(testSlot)) {
        return testSlot;
      }
      attempts++;
    }
  }
  
  // Para navegação vertical, procura na mesma coluna em andares adjacentes
  if (direction === 'up' || direction === 'down') {
    for (let offset = 1; offset < maxFloors; offset++) {
      const testFloor = direction === 'up' ? floor - offset : floor + offset;
      if (testFloor < 0 || testFloor >= maxFloors) break;
      
      const testSlot = positionToSlot.get(`${testFloor}-${col}`);
      if (testSlot && slots.has(testSlot)) {
        return testSlot;
      }
    }
    
    // Loop para navegação vertical
    if (enableLoop) {
      if (direction === 'down') {
        const firstSlot = getFirstSlot();
        if (slots.has(firstSlot)) return firstSlot;
      } else {
        const lastSlot = getLastSlot();
        if (slots.has(lastSlot)) return lastSlot;
      }
    }
  }
  
  return currentSlot;
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
  const { vibrate } = useHapticFeedback();

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
        vibrate('navigation');
        if (!focusedSlot) {
          setFocusedSlot(getFirstSlot());
        } else {
          const next = findNextSlot(focusedSlot, 'up', slots);
          if (next) setFocusedSlot(next);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        vibrate('navigation');
        if (!focusedSlot) {
          setFocusedSlot(getFirstSlot());
        } else {
          const next = findNextSlot(focusedSlot, 'down', slots);
          if (next) setFocusedSlot(next);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        vibrate('navigation');
        if (!focusedSlot) {
          setFocusedSlot(getFirstSlot());
        } else {
          const next = findNextSlot(focusedSlot, 'left', slots);
          if (next) setFocusedSlot(next);
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        vibrate('navigation');
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
        vibrate('medium');
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
  }, [focusedSlot, slots, viewMode, setViewMode, isFullscreen, setIsFullscreen, onSlotSelect, isModalOpen, vibrate]);

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

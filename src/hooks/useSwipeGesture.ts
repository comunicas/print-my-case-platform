import { useCallback, useRef, useState } from 'react';

interface UseSwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: UseSwipeGestureProps) {
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || startX.current === null) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limite o offset para feedback visual
    const maxOffset = 100;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setSwipeOffset(clampedOffset);
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || startX.current === null || currentX.current === null) {
      setSwipeOffset(0);
      return;
    }

    const diff = currentX.current - startX.current;
    
    if (Math.abs(diff) >= threshold) {
      if (diff > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diff < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset
    startX.current = null;
    currentX.current = null;
    setSwipeOffset(0);
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);

  const handlers: SwipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    handlers,
    swipeOffset,
    isSwiping: swipeOffset !== 0,
  };
}

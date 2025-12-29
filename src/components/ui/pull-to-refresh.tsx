import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  isRefreshing, 
  children, 
  disabled = false 
}: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const threshold = 80;
  const maxPull = threshold * 1.5;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only activate if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    // Apply resistance for a more natural feel
    const resistedDistance = Math.min(distance * 0.5, maxPull);
    setPullDistance(resistedDistance);
    
    // Prevent default scroll when pulling
    if (resistedDistance > 0) {
      e.preventDefault();
    }
  }, [pulling, disabled, isRefreshing, startY, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    
    if (pullDistance >= threshold && !isRefreshing) {
      await onRefresh();
    }
    
    setPulling(false);
    setPullDistance(0);
  }, [pulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex flex-col items-center justify-center transition-all duration-200 ease-out z-10 pointer-events-none",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: isRefreshing ? 48 : pullDistance,
          top: 0,
        }}
      >
        <div 
          className={cn(
            "flex items-center gap-2 text-sm text-muted-foreground transition-transform",
            isRefreshing && "py-3"
          )}
          style={{
            transform: `rotate(${progress * 180}deg)`,
          }}
        >
          <RefreshCw 
            className={cn(
              "h-5 w-5 text-primary",
              isRefreshing && "animate-spin"
            )} 
          />
        </div>
        {pullDistance > 20 && !isRefreshing && (
          <span className="text-xs text-muted-foreground mt-1">
            {pullDistance >= threshold ? "Solte para atualizar" : "Puxe para atualizar"}
          </span>
        )}
        {isRefreshing && (
          <span className="text-xs text-muted-foreground">
            Atualizando...
          </span>
        )}
      </div>

      {/* Content with transform */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ 
          transform: `translateY(${isRefreshing ? 48 : pullDistance}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
}

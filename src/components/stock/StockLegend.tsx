import React from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { slotBlockColors, slotVisualLabels } from '@/lib/stockLabels';
import type { SlotVisualStatus } from '@/lib/stockTypes';

interface StockLegendProps {
  brands?: string[];
}

const LEGEND_STATUSES: SlotVisualStatus[] = ['full', 'medium', 'critical', 'empty', 'inactive'];

export const StockLegend = React.memo(function StockLegend({ brands = [] }: StockLegendProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 border-t border-border/50">
      {/* Níveis de estoque */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Níveis:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${slotBlockColors[status]}`} />
              <span className="text-xs text-muted-foreground">{slotVisualLabels[status].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Separador vertical */}
      {brands.length > 0 && (
        <div className="hidden sm:block h-4 w-px bg-border" />
      )}

      {/* Marcas */}
      {brands.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Marcas:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center gap-1">
                <BrandLogo brand={brand} size="xs" showTooltip={false} />
                <span className="text-xs text-muted-foreground">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

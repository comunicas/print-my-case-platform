import { BrandLogo } from '@/components/ui/BrandLogo';

interface StockLegendProps {
  brands?: string[];
}

export function StockLegend({ brands = [] }: StockLegendProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 border-t border-border/50">
      {/* Níveis de estoque */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Níveis:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-xs text-muted-foreground">Cheio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            <span className="text-xs text-muted-foreground">Médio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span className="text-xs text-muted-foreground">Baixo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-destructive" />
            <span className="text-xs text-muted-foreground">Vazio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-muted-foreground">Inativo</span>
          </div>
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
}

import { BrandLogo } from '@/components/ui/BrandLogo';

interface StockLegendProps {
  brands?: string[];
}

export function StockLegend({ brands = [] }: StockLegendProps) {
  return (
    <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg">
      {/* Legenda de cores */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Níveis de Estoque
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm">Cheio (6-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-sm">Médio (3-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-sm">Baixo (1-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive" />
            <span className="text-sm">Vazio (0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-sm">Inativo</span>
          </div>
        </div>
      </div>

      {/* Legenda de marcas */}
      {brands.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Marcas
          </p>
          <div className="flex flex-wrap gap-4">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center gap-2">
                <BrandLogo brand={brand} size="sm" showTooltip={false} />
                <span className="text-sm">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

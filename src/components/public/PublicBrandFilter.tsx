import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { extractBrandFromProductName } from "@/lib/productNormalization";
import { KNOWN_BRANDS } from "@/lib/brandAssets";
import type { PublicStockItem } from "@/hooks/usePublicStock";

interface PublicBrandFilterProps {
  items: PublicStockItem[];
  selectedBrand: string | null;
  onBrandChange: (brand: string | null) => void;
  variant?: "default" | "hero";
}

export function PublicBrandFilter({
  items,
  selectedBrand,
  onBrandChange,
  variant = "default",
}: PublicBrandFilterProps) {
  const isHero = variant === "hero";
  
  // Get unique brands from items, filtered to known brands
  const availableBrands = [...new Set(
    items.map((item) => extractBrandFromProductName(item.product_name))
  )].filter((brand) => KNOWN_BRANDS.includes(brand));

  if (availableBrands.length === 0) {
    return null;
  }

  const baseButtonClass = isHero
    ? "min-h-[44px] px-5 py-3 rounded-full border backdrop-blur-md bg-white/25 text-white border-white/30 hover:bg-white/40 active:scale-95 transition-all duration-200 touch-manipulation data-[state=on]:bg-white data-[state=on]:text-violet-700 data-[state=on]:border-white data-[state=on]:shadow-lg data-[state=on]:font-semibold"
    : "px-4 py-2 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

  const brandButtonClass = isHero
    ? "min-h-[44px] px-4 py-3 rounded-full border backdrop-blur-md bg-white/25 text-white border-white/30 hover:bg-white/40 active:scale-95 transition-all duration-200 touch-manipulation data-[state=on]:bg-white data-[state=on]:text-violet-700 data-[state=on]:border-white data-[state=on]:shadow-lg data-[state=on]:font-semibold flex items-center gap-2"
    : "px-3 py-2 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex items-center gap-2";

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <ToggleGroup
        type="single"
        value={selectedBrand || "all"}
        onValueChange={(value) => onBrandChange(value === "all" ? null : value)}
        className="flex gap-2 w-max"
      >
        <ToggleGroupItem value="all" className={baseButtonClass}>
          Todos
        </ToggleGroupItem>
        {availableBrands.map((brand) => (
          <ToggleGroupItem
            key={brand}
            value={brand}
            className={brandButtonClass}
          >
            <BrandLogo brand={brand} size="xs" />
            <span className="capitalize">{brand.toLowerCase()}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

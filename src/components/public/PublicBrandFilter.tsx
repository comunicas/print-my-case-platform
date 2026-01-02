import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { extractBrandFromProductName } from "@/lib/productNormalization";
import { KNOWN_BRANDS } from "@/lib/brandAssets";
import type { PublicStockItem } from "@/hooks/usePublicStock";

interface PublicBrandFilterProps {
  items: PublicStockItem[];
  selectedBrand: string | null;
  onBrandChange: (brand: string | null) => void;
}

export function PublicBrandFilter({
  items,
  selectedBrand,
  onBrandChange,
}: PublicBrandFilterProps) {
  // Get unique brands from items, filtered to known brands
  const availableBrands = [...new Set(
    items.map((item) => extractBrandFromProductName(item.product_name))
  )].filter((brand) => KNOWN_BRANDS.includes(brand));

  if (availableBrands.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4">
      <ToggleGroup
        type="single"
        value={selectedBrand || "all"}
        onValueChange={(value) => onBrandChange(value === "all" ? null : value)}
        className="flex gap-2 w-max"
      >
        <ToggleGroupItem
          value="all"
          className="px-4 py-2 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          Todos
        </ToggleGroupItem>
        {availableBrands.map((brand) => (
          <ToggleGroupItem
            key={brand}
            value={brand}
            className="px-3 py-2 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex items-center gap-2"
          >
            <BrandLogo brand={brand} size="xs" />
            <span className="capitalize">{brand.toLowerCase()}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

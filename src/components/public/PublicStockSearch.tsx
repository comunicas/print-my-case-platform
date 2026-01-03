import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { extractBrandFromProductName, extractModelFromProductName } from "@/lib/productNormalization";
import type { PublicStockItem } from "@/hooks/usePublicStock";

interface PublicStockSearchProps {
  value: string;
  onChange: (value: string) => void;
  items: PublicStockItem[];
  variant?: "default" | "hero";
}

const statusConfig = {
  available: {
    label: "Disponível",
    className: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  low: {
    label: "Últimas un.",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  unavailable: {
    label: "Indisponível",
    className: "bg-muted text-muted-foreground",
  },
};

export function PublicStockSearch({ value, onChange, items, variant = "default" }: PublicStockSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, 300);

  const isHero = variant === "hero";

  // Sync when external value changes (e.g., "Clear filters")
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Propagate debounced value to parent
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    const searchLower = inputValue.toLowerCase();
    return items
      .filter((item) => item.product_name.toLowerCase().includes(searchLower))
      .slice(0, 8);
  }, [inputValue, items]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (newValue.trim()) {
      setOpen(true);
    }
  };

  const handleSelect = (productName: string) => {
    const model = extractModelFromProductName(productName);
    setInputValue(model);
    onChange(model);
    setOpen(false);
  };

  return (
    <Popover open={open && filteredSuggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${
            isHero ? "text-purple-600" : "text-muted-foreground"
          }`} />
          <Input
            type="search"
            placeholder="Buscar modelo..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => inputValue.trim() && setOpen(true)}
            className={`pl-12 pr-4 ${
              isHero 
                ? "h-12 bg-white shadow-xl rounded-2xl border-0 text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-white/30 touch-manipulation" 
                : ""
            }`}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
            <CommandGroup heading="Sugestões">
              {filteredSuggestions.map((item) => {
                const brand = extractBrandFromProductName(item.product_name);
                const model = extractModelFromProductName(item.product_name);
                const config = statusConfig[item.status];

                return (
                  <CommandItem
                    key={item.product_name}
                    value={item.product_name}
                    onSelect={() => handleSelect(item.product_name)}
                    className="flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BrandLogo brand={brand} size="sm" />
                      <span className="text-sm">{model}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${config.className}`}>
                      {config.label}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

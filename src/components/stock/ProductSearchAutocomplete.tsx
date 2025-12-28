import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BrandLogo } from '@/components/ui/BrandLogo';

export interface ProductSuggestion {
  productKey: string;
  brand: string;
  model: string;
  totalSold: number;
}

interface ProductSearchAutocompleteProps {
  suggestions: ProductSuggestion[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProductSearchAutocomplete({
  suggestions,
  value,
  onChange,
  placeholder = "Buscar modelo...",
}: ProductSearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Filtra sugestões baseado no input
  const filteredSuggestions = useMemo(() => {
    if (!inputValue) return suggestions.slice(0, 10);
    
    const term = inputValue.toLowerCase();
    return suggestions
      .filter(s => 
        s.model.toLowerCase().includes(term) || 
        s.brand.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [suggestions, inputValue]);

  const handleSelect = (suggestion: ProductSuggestion) => {
    setInputValue(suggestion.model);
    onChange(suggestion.model);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full min-w-[200px] max-w-[300px] justify-between font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !inputValue && "text-muted-foreground")}>
              {inputValue || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-3 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado
              </div>
            </CommandEmpty>
            <CommandGroup heading="Produtos">
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.productKey}
                  value={suggestion.productKey}
                  onSelect={() => handleSelect(suggestion)}
                  className="flex items-center gap-3 py-2"
                >
                  <BrandLogo brand={suggestion.brand} size="xs" showTooltip={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{suggestion.model}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{suggestion.totalSold} vendas</span>
                    </div>
                  </div>
                  {inputValue.toLowerCase() === suggestion.model.toLowerCase() && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

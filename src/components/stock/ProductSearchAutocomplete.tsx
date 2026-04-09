import { useState, useMemo, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Search, X, Loader2, ShoppingCart } from 'lucide-react';
import { cn, pluralize } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useDebounce } from '@/hooks/useDebounce';

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
  countLabel?: { singular: string; plural: string };
}

function highlightMatch(text: string, term: string): ReactNode {
  if (!term.trim()) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-foreground rounded-sm px-0.5">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export function ProductSearchAutocomplete({
  suggestions,
  value,
  onChange,
  placeholder = "Buscar modelo...",
  countLabel = { singular: 'venda', plural: 'vendas' },
}: ProductSearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPropagated = useRef(value);
  const debouncedValue = useDebounce(inputValue, 300);
  const isDebouncing = inputValue !== debouncedValue;

  // Stable ref for onChange to avoid dependency issues
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync external value (e.g. clearFilters) — only if truly different
  useEffect(() => {
    if (value !== inputValue && value !== lastPropagated.current) {
      setInputValue(value);
      lastPropagated.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Propagate debounced value — only when it actually changed
  useEffect(() => {
    if (debouncedValue !== lastPropagated.current) {
      lastPropagated.current = debouncedValue;
      onChangeRef.current(debouncedValue);
    }
  }, [debouncedValue]);

  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) {
      // Show top 5 most sold when empty
      return [...suggestions].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);
    }
    const term = inputValue.toLowerCase();
    return suggestions
      .filter(s =>
        s.model.toLowerCase().includes(term) ||
        s.brand.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [suggestions, inputValue]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (newValue.trim() || document.activeElement === inputRef.current) {
      setOpen(true);
    }
  };

  const handleSelect = (suggestion: ProductSuggestion) => {
    setInputValue(suggestion.model);
    onChange(suggestion.model);
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <Popover open={open && filteredSuggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-9 pr-9 h-10 [&::-webkit-search-cancel-button]:hidden"
            data-testid="search-input"
          />
          {isDebouncing && inputValue.trim() && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isDebouncing && inputValue.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {!inputValue.trim() && (
            <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground font-medium">Mais vendidos</p>
          )}
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion.productKey}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-3 text-left",
                "hover:bg-accent cursor-pointer transition-colors",
                inputValue.toLowerCase() === suggestion.model.toLowerCase() && "bg-accent"
              )}
            >
              <BrandLogo brand={suggestion.brand} size="xs" showTooltip={false} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {highlightMatch(suggestion.model, inputValue)}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ShoppingCart className="h-3 w-3" />
                  <span>{pluralize(suggestion.totalSold, countLabel.singular, countLabel.plural)}</span>
                </div>
              </div>
            </button>
          ))}
          {inputValue.trim() && filteredSuggestions.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

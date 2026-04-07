import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractBrandFromProductName } from "@/lib/productNormalization";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface PDVOption {
  id: string;
  name: string;
}

interface PreStockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdvs: PDVOption[];
  productNames: string[];
  onSubmit: (data: {
    pdv_id?: string | null;
    product_name: string;
    quantity: number;
    notes?: string;
  }) => void;
  isSubmitting: boolean;
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function matchesAllTokens(name: string, tokens: string[]): boolean {
  const lower = name.toLowerCase();
  return tokens.every((token) => lower.includes(token));
}

function HighlightedName({ name, tokens }: { name: string; tokens: string[] }) {
  if (tokens.length === 0) return <span>{name}</span>;

  // Build regex from tokens, escape special chars
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = name.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function PreStockForm({
  open,
  onOpenChange,
  pdvs,
  productNames,
  onSubmit,
  isSubmitting,
}: PreStockFormProps) {
  const [pdvId, setPdvId] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [productOpen, setProductOpen] = useState(false);

  const tokens = useMemo(() => tokenize(searchTerm), [searchTerm]);

  const filteredProducts = useMemo(() => {
    if (tokens.length === 0) return productNames.slice(0, 30);
    return productNames.filter((name) => matchesAllTokens(name, tokens)).slice(0, 30);
  }, [productNames, tokens]);

  const resetForm = () => {
    setPdvId("");
    setProductName("");
    setSearchTerm("");
    setQuantity("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !quantity) return;

    onSubmit({
      pdv_id: pdvId || null,
      product_name: productName.trim(),
      quantity: parseInt(quantity, 10),
      notes: notes.trim() || undefined,
    });

    resetForm();
  };

  const isValid = productName.trim() && productNames.includes(productName) && parseInt(quantity, 10) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Compra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PDV Select */}
          <div className="space-y-2">
            <Label>PDV (opcional)</Label>
            <Select value={pdvId} onValueChange={setPdvId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o PDV destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem PDV específico</SelectItem>
                {pdvs.map((pdv) => (
                  <SelectItem key={pdv.id} value={pdv.id}>
                    {pdv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product autocomplete */}
          <div className="space-y-2">
            <Label>Produto *</Label>
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productOpen}
                  className="w-full justify-between font-normal"
                >
                  {productName ? (
                    <span className="flex items-center gap-2 truncate">
                      <BrandLogo brand={extractBrandFromProductName(productName)} size="xs" showTooltip={false} />
                      <span className="truncate">{productName}</span>
                    </span>
                  ) : (
                    "Buscar produto..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Ex: iphone 15, redmi 14, galaxy s24..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searchTerm.trim()
                        ? "Nenhum produto encontrado"
                        : "Digite o nome do produto"}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredProducts.map((name) => {
                        const brand = extractBrandFromProductName(name);
                        return (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={(value) => {
                              setProductName(value);
                              setSearchTerm("");
                              setProductOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                productName === name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <BrandLogo brand={brand} size="xs" showTooltip={false} className="mr-1.5 shrink-0" />
                            <span className="truncate">
                              <HighlightedName name={name} tokens={tokens} />
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantidade *</Label>
            <Input
              type="number"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 10"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fornecedor, nota fiscal, etc."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); resetForm(); }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

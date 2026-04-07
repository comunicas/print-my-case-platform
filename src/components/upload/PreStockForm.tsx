import { useState } from "react";
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
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [productOpen, setProductOpen] = useState(false);

  const resetForm = () => {
    setPdvId("");
    setProductName("");
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

  const isValid = productName.trim() && parseInt(quantity, 10) > 0;

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
                  {productName || "Buscar produto..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar produto..."
                    value={productName}
                    onValueChange={setProductName}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {productName.trim() ? (
                        <button
                          type="button"
                          className="w-full p-2 text-sm text-left hover:bg-accent"
                          onClick={() => { setProductOpen(false); }}
                        >
                          Usar "{productName.trim()}"
                        </button>
                      ) : (
                        "Digite o nome do produto"
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {productNames
                        .filter((name) =>
                          name.toLowerCase().includes(productName.toLowerCase())
                        )
                        .slice(0, 20)
                        .map((name) => (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={(value) => {
                              setProductName(value);
                              setProductOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                productName === name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {name}
                          </CommandItem>
                        ))}
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

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { financialEntrySchema, type FinancialEntryFormData } from "@/lib/schemas/financial";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { usePDVs } from "@/hooks/usePDVs";
import { useFinancialDescriptions } from "@/hooks/useFinancialDescriptions";
import { format } from "date-fns";
import type { FinancialEntry } from "@/hooks/useFinancialEntries";

interface FinancialEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinancialEntryFormData) => void;
  isPending: boolean;
  editEntry?: FinancialEntry | null;
  defaultMonth: Date;
}

export function FinancialEntryForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  editEntry,
  defaultMonth,
}: FinancialEntryFormProps) {
  const { pdvs } = usePDVs();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FinancialEntryFormData>({
    resolver: zodResolver(financialEntrySchema),
    defaultValues: {
      category: "fixas",
      description: "",
      amount: 0,
      reference_month: defaultMonth,
      pdv_id: null,
    },
  });

  const category = form.watch("category");
  const descriptionValue = form.watch("description");
  const { data: suggestions = [] } = useFinancialDescriptions({ category });

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes((descriptionValue ?? "").toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    if (editEntry) {
      form.reset({
        category: editEntry.category as "deducoes" | "implantacao" | "fixas",
        description: editEntry.description,
        amount: Number(editEntry.amount),
        reference_month: new Date(editEntry.reference_month),
        pdv_id: editEntry.pdv_id,
      });
    } else {
      form.reset({
        category: "fixas",
        description: "",
        amount: 0,
        reference_month: defaultMonth,
        pdv_id: null,
      });
    }
  }, [open, editEntry, defaultMonth, form]);

  const handleSubmit = (data: FinancialEntryFormData) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editEntry ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="deducoes">Deduções da Venda</SelectItem>
                      <SelectItem value="implantacao">Implantação</SelectItem>
                      <SelectItem value="fixas">Despesas Fixas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Descrição</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Input
                          ref={inputRef}
                          placeholder="Ex: Aluguel do ponto"
                          maxLength={200}
                          autoComplete="off"
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (!popoverOpen && e.target.value.length >= 0) {
                              setPopoverOpen(true);
                            }
                          }}
                          onFocus={() => setPopoverOpen(true)}
                        />
                      </FormControl>
                    </PopoverTrigger>
                    {filteredSuggestions.length > 0 && (
                      <PopoverContent
                        className="p-0 w-[var(--radix-popover-trigger-width)]"
                        align="start"
                        sideOffset={4}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {filteredSuggestions.map((suggestion) => (
                                <CommandItem
                                  key={suggestion}
                                  value={suggestion}
                                  onSelect={() => {
                                    field.onChange(suggestion);
                                    setPopoverOpen(false);
                                    inputRef.current?.focus();
                                  }}
                                >
                                  {suggestion}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    )}
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de Referência</FormLabel>
                  <FormControl>
                    <Input
                      type="month"
                      value={field.value ? format(field.value, "yyyy-MM") : ""}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split("-").map(Number);
                        field.onChange(new Date(year, month - 1, 1));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pdv_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDV (opcional)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                    defaultValue={field.value ?? "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os PDVs" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Todos os PDVs</SelectItem>
                      {pdvs.map((pdv) => (
                        <SelectItem key={pdv.id} value={pdv.id}>
                          {pdv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : editEntry ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

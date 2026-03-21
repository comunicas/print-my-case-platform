import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { SalesRecordItem, CreateSalesRecordData } from "@/hooks/useSalesRecords";

const schema = z.object({
  pdv_id: z.string().min(1, "Selecione um PDV"),
  device_id: z.string().min(1, "Obrigatório"),
  order_number: z.string().min(1, "Obrigatório"),
  product_name: z.string().min(1, "Obrigatório"),
  amount: z.coerce.number().min(0, "Valor inválido"),
  payment_date: z.string().optional(),
  payment_method: z.string().optional(),
  status: z.string().optional(),
  refund_amount: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdvOptions: { id: string; name: string; machine_id: string }[];
  editingRecord?: SalesRecordItem | null;
  onSubmit: (data: CreateSalesRecordData) => void;
  isSubmitting: boolean;
}

export function SalesRecordFormDialog({
  open,
  onOpenChange,
  pdvOptions,
  editingRecord,
  onSubmit,
  isSubmitting,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pdv_id: "",
      device_id: "",
      order_number: "",
      product_name: "",
      amount: 0,
      payment_date: "",
      payment_method: "",
      status: "Completed",
      refund_amount: 0,
    },
  });

  useEffect(() => {
    if (editingRecord) {
      form.reset({
        pdv_id: editingRecord.pdv_id,
        device_id: editingRecord.device_id,
        order_number: editingRecord.order_number,
        product_name: editingRecord.product_name,
        amount: editingRecord.amount,
        payment_date: editingRecord.payment_date
          ? new Date(editingRecord.payment_date).toISOString().slice(0, 16)
          : "",
        payment_method: editingRecord.payment_method ?? "",
        status: editingRecord.status ?? "Completed",
        refund_amount: editingRecord.refund_amount ?? 0,
      });
    } else {
      form.reset({
        pdv_id: "",
        device_id: "",
        order_number: "",
        product_name: "",
        amount: 0,
        payment_date: "",
        payment_method: "",
        status: "Completed",
        refund_amount: 0,
      });
    }
  }, [editingRecord, open]);

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      payment_date: values.payment_date || undefined,
      payment_method: values.payment_method || undefined,
      status: values.status || undefined,
      refund_amount: values.refund_amount || undefined,
    });
  };

  // Auto-fill device_id from selected PDV
  const selectedPdvId = form.watch("pdv_id");
  useEffect(() => {
    if (!editingRecord && selectedPdvId) {
      const pdv = pdvOptions.find((p) => p.id === selectedPdvId);
      if (pdv) form.setValue("device_id", pdv.machine_id);
    }
  }, [selectedPdvId, editingRecord]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRecord ? "Editar Venda" : "Nova Venda"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>PDV</Label>
              <Select
                value={form.watch("pdv_id")}
                onValueChange={(v) => form.setValue("pdv_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {pdvOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.pdv_id && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.pdv_id.message}
                </p>
              )}
            </div>

            <div>
              <Label>Nº Pedido</Label>
              <Input {...form.register("order_number")} />
              {form.formState.errors.order_number && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.order_number.message}
                </p>
              )}
            </div>

            <div>
              <Label>Device ID</Label>
              <Input {...form.register("device_id")} />
            </div>

            <div className="col-span-2">
              <Label>Produto</Label>
              <Input {...form.register("product_name")} />
              {form.formState.errors.product_name && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.product_name.message}
                </p>
              )}
            </div>

            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" {...form.register("amount")} />
            </div>

            <div>
              <Label>Reembolso (R$)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("refund_amount")}
              />
            </div>

            <div>
              <Label>Data Pagamento</Label>
              <Input type="datetime-local" {...form.register("payment_date")} />
            </div>

            <div>
              <Label>Método</Label>
              <Select
                value={form.watch("payment_method") || ""}
                onValueChange={(v) => form.setValue("payment_method", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="creditCard">Cartão Crédito</SelectItem>
                  <SelectItem value="debitCard">Cartão Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={form.watch("status") || "Completed"}
                onValueChange={(v) => form.setValue("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Concluído</SelectItem>
                  <SelectItem value="Cancelled">Cancelado</SelectItem>
                  <SelectItem value="Refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRecord ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

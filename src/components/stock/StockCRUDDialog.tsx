import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface StockRecordFormData {
  id?: string;
  slot_number: string;
  product_name: string;
  quantity: number;
  is_active: boolean;
}

interface StockCRUDDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StockRecordFormData) => void;
  initialData?: StockRecordFormData | null;
  isLoading?: boolean;
}

export function StockCRUDDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: StockCRUDDialogProps) {
  const isEdit = !!initialData?.id;

  const [slotNumber, setSlotNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setSlotNumber(initialData?.slot_number || '');
      setProductName(initialData?.product_name || '');
      setQuantity(initialData?.quantity ?? 0);
      setIsActive(initialData?.is_active ?? true);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotNumber.trim() || !productName.trim()) return;

    onSubmit({
      id: initialData?.id,
      slot_number: slotNumber.trim(),
      product_name: productName.trim(),
      quantity: Math.max(0, quantity),
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Registro' : 'Novo Registro de Estoque'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Altere os dados do registro de estoque.' : 'Adicione um novo registro de estoque manualmente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slot_number">Slot</Label>
            <Input
              id="slot_number"
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
              placeholder="Ex: 01, 02..."
              required
              disabled={isEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_name">Produto</Label>
            <Input
              id="product_name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: JBL Tune 510BT"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Ativo</Label>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !slotNumber.trim() || !productName.trim()}>
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

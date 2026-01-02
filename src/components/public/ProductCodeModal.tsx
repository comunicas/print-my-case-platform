import { forwardRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ProductCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  productName: string;
  qrcodeUrl: string;
}

export const ProductCodeModal = forwardRef<HTMLDivElement, ProductCodeModalProps>(
  ({ isOpen, onClose, code, productName, qrcodeUrl }, ref) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado!", {
        description: "O código foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">🎁 Presente para você: R$ 10 OFF na sua próxima compra!</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Código */}
          <div className="flex items-center gap-2">
            <div className="px-6 py-3 bg-muted rounded-lg border-2 border-dashed border-primary/30">
              <span className="text-2xl font-bold font-mono tracking-wider">{code}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* QR Code Image */}
          <div className="p-4 bg-white rounded-lg">
            <img 
              src={qrcodeUrl} 
              alt="QR Code" 
              className="w-40 h-40 object-contain"
            />
          </div>

          {/* Modelo selecionado */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Modelo selecionado:</p>
            <p className="font-medium">{productName}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
  }
);

ProductCodeModal.displayName = "ProductCodeModal";

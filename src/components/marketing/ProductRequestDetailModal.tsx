import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, CheckCircle2, XCircle, Clock, User, MessageSquare, Package } from "lucide-react";
import { ProductRequest, ProductRequestStatus } from "@/hooks/useProductRequests";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG: Record<ProductRequestStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  pending: { label: "Pendente", variant: "default", icon: <Clock className="h-3 w-3" /> },
  contacted: { label: "Contatado", variant: "secondary", icon: <Phone className="h-3 w-3" /> },
  resolved: { label: "Resolvido", variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: "Cancelado", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

interface ProductRequestDetailModalProps {
  request: ProductRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: ProductRequestStatus) => Promise<void>;
  onOpenWhatsApp: (phone: string, customerName: string, model: string) => void;
}

export function ProductRequestDetailModal({
  request,
  open,
  onOpenChange,
  onStatusChange,
  onOpenWhatsApp,
}: ProductRequestDetailModalProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <Badge variant={STATUS_CONFIG[request.status].variant} className="gap-1">
              {STATUS_CONFIG[request.status].icon}
              {STATUS_CONFIG[request.status].label}
            </Badge>
          </div>
          <DialogDescription>
            Recebido em {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{request.customer_name}</p>
              <p className="text-sm text-muted-foreground">{request.customer_phone}</p>
              {request.customer_email && (
                <p className="text-sm text-muted-foreground">{request.customer_email}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Modelo solicitado</p>
              <p className="font-medium">{request.requested_model}</p>
            </div>
          </div>

          {request.message && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Mensagem</p>
                  <p className="text-sm">{request.message}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className="space-y-3 pt-2">
          <Button
            className="w-full"
            onClick={() => onOpenWhatsApp(request.customer_phone, request.customer_name, request.requested_model)}
          >
            <Phone className="h-4 w-4 mr-2" />
            Abrir WhatsApp
          </Button>

          <div className="flex gap-2">
            {request.status !== "contacted" && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onStatusChange(request.id, "contacted")}
              >
                Marcar Contatado
              </Button>
            )}
            {request.status !== "resolved" && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onStatusChange(request.id, "resolved")}
              >
                Marcar Resolvido
              </Button>
            )}
          </div>

          {request.status !== "cancelled" && (
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => onStatusChange(request.id, "cancelled")}
            >
              Cancelar Pedido
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

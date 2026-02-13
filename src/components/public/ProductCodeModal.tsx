import { forwardRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Copy, Check, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { unformatPhoneNumber } from "@/lib/utils/phone-mask";

interface ProductCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  productName: string;
  qrcodeUrl: string;
  modalText?: string | null;
  organizationId: string;
  pdvId: string | null;
  catalogSlug: string;
}

export const ProductCodeModal = forwardRef<HTMLDivElement, ProductCodeModalProps>(
  ({ isOpen, onClose, code, productName, qrcodeUrl, modalText, organizationId, pdvId, catalogSlug }, ref) => {
    const [step, setStep] = useState<"lead" | "revealed">("lead");
    const [phone, setPhone] = useState("");
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const displayText = modalText || "🎁 Presente para você: R$ 10 OFF na sua próxima compra!";
    const rawDigits = unformatPhoneNumber(phone);
    const isPhoneValid = rawDigits.length >= 10 && rawDigits.length <= 11;

    const handleSubmitLead = async () => {
      if (!isPhoneValid) return;
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from("catalog_leads" as any).insert({
          organization_id: organizationId,
          pdv_id: pdvId,
          phone: rawDigits,
          product_name: productName,
          catalog_slug: catalogSlug,
        });
        if (error) throw error;
        setStep("revealed");
      } catch {
        toast.error("Não foi possível salvar. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado!", {
        description: "O código foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
      onClose();
      // Reset state after animation
      setTimeout(() => {
        setStep("lead");
        setPhone("");
        setCopied(false);
      }, 300);
    };

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{displayText}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* QR Code - blurred on lead step, clear on revealed */}
            <div className="p-4 bg-white rounded-lg relative">
              <img
                src={qrcodeUrl}
                alt="QR Code"
                className="w-40 h-40 object-contain transition-all duration-500"
                style={{ filter: step === "lead" ? "blur(8px)" : "none" }}
              />
              {step === "lead" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground/60" />
                </div>
              )}
            </div>

            {step === "lead" ? (
              /* Step 1: Lead capture */
              <div className="w-full space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">
                    Informe seu WhatsApp para liberar seu cupom
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-phone">WhatsApp</Label>
                  <PhoneInput
                    id="whatsapp-phone"
                    value={phone}
                    onChange={setPhone}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitLead}
                  disabled={!isPhoneValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Liberar meu cupom
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  🔒 Não se preocupe, não vamos enviar spam
                </p>
              </div>
            ) : (
              /* Step 2: Coupon revealed */
              <>
                {/* Code */}
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

                {/* Selected model */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Modelo selecionado:</p>
                  <p className="font-medium">{productName}</p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  📱 Enviamos o cupom para seu WhatsApp também!
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

ProductCodeModal.displayName = "ProductCodeModal";

import { forwardRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Copy, Check, Lock, Loader2, ShieldCheck } from "lucide-react";
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
    const [step, setStep] = useState<"phone" | "otp" | "revealed">("phone");
    const [phone, setPhone] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const displayText = modalText || "🎁 Presente para você: R$ 10 OFF na sua próxima compra!";
    const rawDigits = unformatPhoneNumber(phone);
    const isPhoneValid = rawDigits.length >= 10 && rawDigits.length <= 11;

    const handleSendOtp = async () => {
      if (!isPhoneValid) return;
      setIsSubmitting(true);
      try {
        const { data, error } = await supabase.functions.invoke("send-otp", {
          body: { phone: rawDigits },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setStep("otp");
        toast.success("Código enviado!", {
          description: "Verifique seu SMS.",
        });
      } catch (err: any) {
        toast.error(err?.message || "Erro ao enviar código. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleVerifyOtp = async () => {
      if (otpCode.length !== 6) return;
      setIsSubmitting(true);
      try {
        const { data, error } = await supabase.functions.invoke("verify-otp", {
          body: { phone: rawDigits, code: otpCode },
        });
        if (error) throw error;
        if (!data?.verified) {
          toast.error(data?.error || "Código inválido ou expirado.");
          setIsSubmitting(false);
          return;
        }

        // OTP verified — save lead
        const { error: leadError } = await supabase.from("catalog_leads" as any).insert({
          organization_id: organizationId,
          pdv_id: pdvId,
          phone: rawDigits,
          product_name: productName,
          catalog_slug: catalogSlug,
        });
        if (leadError) throw leadError;

        setStep("revealed");
      } catch {
        toast.error("Não foi possível verificar. Tente novamente.");
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
      setTimeout(() => {
        setStep("phone");
        setPhone("");
        setOtpCode("");
        setCopied(false);
      }, 300);
    };

    const blurred = step !== "revealed";

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{displayText}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* QR Code */}
            <div className="p-4 bg-white rounded-lg relative">
              <img
                src={qrcodeUrl}
                alt="QR Code"
                className="w-40 h-40 object-contain transition-all duration-500"
                style={{ filter: blurred ? "blur(8px)" : "none" }}
              />
              {blurred && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground/60" />
                </div>
              )}
            </div>

            {step === "phone" && (
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
                  onClick={handleSendOtp}
                  disabled={!isPhoneValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  Enviar código de verificação
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  🔒 Enviaremos um código SMS para confirmar seu número
                </p>
              </div>
            )}

            {step === "otp" && (
              <div className="w-full space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">
                    Digite o código de 6 dígitos enviado por SMS
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enviado para +55 {rawDigits}
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Verificar e liberar cupom
                </Button>

                <button
                  type="button"
                  className="text-xs text-muted-foreground underline mx-auto block"
                  onClick={() => {
                    setStep("phone");
                    setOtpCode("");
                  }}
                >
                  Alterar número
                </button>
              </div>
            )}

            {step === "revealed" && (
              <>
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

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Modelo selecionado:</p>
                  <p className="font-medium">{productName}</p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  ✅ Número verificado! Cupom liberado com sucesso.
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

import { forwardRef, useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Copy, Check, Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { unformatPhoneNumber } from "@/lib/utils/phone-mask";

type HCaptchaApi = {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string | number;
};

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
  onOpen?: () => void;
}

export const ProductCodeModal = forwardRef<HTMLDivElement, ProductCodeModalProps>(
  ({ isOpen, onClose, code, productName, qrcodeUrl, modalText, organizationId, pdvId, catalogSlug }, ref) => {
    const [step, setStep] = useState<"phone" | "otp" | "revealed">("phone");
    const [phone, setPhone] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [otpExpired, setOtpExpired] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaWidgetId, setCaptchaWidgetId] = useState<string | null>(null);

    const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined;

    const displayText = modalText || "🎁 Presente para você: R$ 10 OFF na sua próxima compra!";
    const rawDigits = unformatPhoneNumber(phone);
    const isPhoneValid = rawDigits.length >= 10 && rawDigits.length <= 11;

    // Countdown timer for OTP expiration
    useEffect(() => {
      if (step !== "otp" || countdown <= 0) return;
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, [step, countdown]);

    const startCountdown = useCallback(() => {
      setCountdown(60);
      setOtpExpired(false);
      setOtpCode("");
    }, []);

    useEffect(() => {
      if (!isOpen || !hcaptchaSiteKey) return;

      const ensureScript = () =>
        new Promise<void>((resolve, reject) => {
          const existing = document.getElementById("hcaptcha-script") as HTMLScriptElement | null;
          if (existing) {
            resolve();
            return;
          }

          const script = document.createElement("script");
          script.id = "hcaptcha-script";
          script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Falha ao carregar hCaptcha"));
          document.body.appendChild(script);
        });

      const renderCaptcha = async () => {
        try {
          await ensureScript();
          const container = document.getElementById("hcaptcha-container");
          const hcaptcha = (window as Window & { hcaptcha?: HCaptchaApi }).hcaptcha;
          if (!container || !hcaptcha || captchaWidgetId) return;

          const widgetId = String(hcaptcha.render(container, {
            sitekey: hcaptchaSiteKey,
            callback: (token: string) => setCaptchaToken(token),
            "expired-callback": () => setCaptchaToken(null),
            "error-callback": () => setCaptchaToken(null),
          }));
          setCaptchaWidgetId(widgetId);
        } catch {
          toast.error("Não foi possível carregar o captcha.");
        }
      };

      renderCaptcha();
    }, [isOpen, hcaptchaSiteKey, captchaWidgetId]);

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
        startCountdown();
        toast.success("Código enviado!", {
          description: "Verifique seu SMS.",
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erro ao enviar código. Tente novamente.");
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

        const fingerprint = `${navigator.userAgent}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${window.screen.width}x${window.screen.height}`;

        const { data: leadResponse, error: leadError } = await supabase.functions.invoke("submit-catalog-lead", {
          body: {
            organization_id: organizationId,
            pdv_id: pdvId,
            phone: rawDigits,
            product_name: productName,
            catalog_slug: catalogSlug,
            fingerprint,
            captcha_token: captchaToken,
          },
        });
        if (leadError) throw leadError;
        if (leadResponse?.error) throw new Error(leadResponse.error);

        setStep("revealed");

        // Facebook Pixel: CompleteRegistration on coupon reveal
        if (typeof window.fbq === "function") {
          window.fbq("track", "CompleteRegistration", {
            content_name: productName,
          });
        }
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
        setCountdown(0);
        setOtpExpired(false);
        setCaptchaToken(null);
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

                {hcaptchaSiteKey ? (
                  <div className="flex justify-center">
                    <div id="hcaptcha-container" />
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 text-center">
                    Captcha não configurado neste ambiente.
                  </p>
                )}
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

                {/* Countdown indicator */}
                <div className="flex justify-center">
                  {otpExpired ? (
                    <span className="text-sm font-medium text-destructive">
                      ⏰ Código expirado
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">
                      ⏳ Expira em {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={otpExpired}
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

                {otpExpired ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Reenviar código
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleVerifyOtp}
                    disabled={otpCode.length !== 6 || isSubmitting || (Boolean(hcaptchaSiteKey) && !captchaToken)}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Verificar e liberar cupom
                  </Button>
                )}

                <button
                  type="button"
                  className="text-xs text-muted-foreground underline mx-auto block"
                  onClick={() => {
                    setStep("phone");
                    setOtpCode("");
                    setCountdown(0);
                    setOtpExpired(false);
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

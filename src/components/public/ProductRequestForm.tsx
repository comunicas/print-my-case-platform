import { forwardRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { productRequestSchema } from "@/lib/schemas/productRequest";
import { parseZodErrors } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductRequestFormProps {
  organizationId: string;
  onSubmit: (data: {
    organization_id: string;
    customer_name: string;
    customer_phone: string;
    requested_model: string;
  }) => void;
  isSubmitting: boolean;
}

export const ProductRequestForm = forwardRef<HTMLDivElement, ProductRequestFormProps>(
  ({ organizationId, onSubmit, isSubmitting }, ref) => {
    const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    requestedModel: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = productRequestSchema.safeParse(formData);
    const validationErrors = parseZodErrors(result);
    
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    onSubmit({
      organization_id: organizationId,
      customer_name: formData.customerName.trim(),
      customer_phone: formData.customerPhone,
      requested_model: formData.requestedModel.trim(),
    });

    // Show success feedback
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Reset form on success
    setFormData({
      customerName: "",
      customerPhone: "",
      requestedModel: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

    const inputClassName = "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

    return (
      <Card ref={ref} className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Não encontrou seu modelo?</CardTitle>
        <CardDescription>
          Deixe seus dados e avisaremos quando estiver disponível!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="font-medium text-lg">Pedido enviado com sucesso!</p>
            <p className="text-sm text-muted-foreground">Entraremos em contato em breve.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Nome <span className="text-destructive">*</span>
                </Label>
              <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleChange("customerName", e.target.value)}
                  placeholder="Seu nome"
                  disabled={isSubmitting}
                  className={cn(inputClassName, errors.customerName && "border-destructive")}
                />
                {errors.customerName && (
                  <p className="text-sm text-destructive">{errors.customerName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">
                  WhatsApp <span className="text-destructive">*</span>
                </Label>
                <PhoneInput
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(value) => handleChange("customerPhone", value)}
                  placeholder="(00) 00000-0000"
                  disabled={isSubmitting}
                  className={cn(inputClassName, errors.customerPhone && "border-destructive")}
                />
                {errors.customerPhone && (
                  <p className="text-sm text-destructive">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedModel">
                Modelo desejado <span className="text-destructive">*</span>
              </Label>
              <Input
                id="requestedModel"
                value={formData.requestedModel}
                onChange={(e) => handleChange("requestedModel", e.target.value)}
                placeholder="Ex: iPhone 15 Pro Max"
                disabled={isSubmitting}
                className={cn(inputClassName, errors.requestedModel && "border-destructive")}
              />
              {errors.requestedModel && (
                <p className="text-sm text-destructive">{errors.requestedModel}</p>
              )}
            </div>

            <Button 
              type="submit" 
              variant="hero"
              className="w-full" 
              disabled={isSubmitting}
              aria-label="Enviar pedido de modelo"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Pedido
                </>
              )}
            </Button>
          </form>
        )}
        </CardContent>
      </Card>
    );
  }
);

ProductRequestForm.displayName = "ProductRequestForm";

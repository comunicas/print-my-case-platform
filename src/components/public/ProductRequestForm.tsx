import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { productRequestSchema } from "@/lib/schemas/productRequest";
import { parseZodErrors } from "@/lib/utils";

interface ProductRequestFormProps {
  organizationId: string;
  onSubmit: (data: {
    organization_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    requested_model: string;
    message?: string;
  }) => void;
  isSubmitting: boolean;
}

export function ProductRequestForm({ organizationId, onSubmit, isSubmitting }: ProductRequestFormProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    requestedModel: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      customer_email: formData.customerEmail.trim() || undefined,
      requested_model: formData.requestedModel.trim(),
      message: formData.message.trim() || undefined,
    });

    // Reset form on success
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      requestedModel: "",
      message: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Não encontrou seu modelo?</CardTitle>
        <CardDescription>
          Deixe seus dados e avisaremos quando estiver disponível!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                placeholder="Seu nome"
                className={errors.customerName ? "border-destructive" : ""}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone *</Label>
              <PhoneInput
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(value) => handleChange("customerPhone", value)}
                placeholder="(00) 00000-0000"
                className={errors.customerPhone ? "border-destructive" : ""}
              />
              {errors.customerPhone && (
                <p className="text-sm text-destructive">{errors.customerPhone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">E-mail (opcional)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleChange("customerEmail", e.target.value)}
              placeholder="seu@email.com"
              className={errors.customerEmail ? "border-destructive" : ""}
            />
            {errors.customerEmail && (
              <p className="text-sm text-destructive">{errors.customerEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedModel">Modelo desejado *</Label>
            <Input
              id="requestedModel"
              value={formData.requestedModel}
              onChange={(e) => handleChange("requestedModel", e.target.value)}
              placeholder="Ex: iPhone 15 Pro Max"
              className={errors.requestedModel ? "border-destructive" : ""}
            />
            {errors.requestedModel && (
              <p className="text-sm text-destructive">{errors.requestedModel}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Alguma observação ou preferência?"
              rows={3}
              className={errors.message ? "border-destructive" : ""}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar Pedido
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
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
    requested_model: string;
  }) => void;
  isSubmitting: boolean;
}

export function ProductRequestForm({ organizationId, onSubmit, isSubmitting }: ProductRequestFormProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    requestedModel: "",
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
      requested_model: formData.requestedModel.trim(),
    });

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
              <Label htmlFor="customerPhone">WhatsApp *</Label>
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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PDVFormData } from "@/lib/schemas/pdv";

interface PDVFormProps {
  values: PDVFormData;
  onChange: (values: PDVFormData) => void;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
  idPrefix?: string;
}

export function PDVForm({
  values,
  onChange,
  errors,
  onClearError,
  idPrefix = "",
}: PDVFormProps) {
  const handleChange = (field: keyof PDVFormData, value: string) => {
    onChange({ ...values, [field]: value });
    if (errors[field]) onClearError(field);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}name`}>Nome do PDV *</Label>
        <Input
          id={`${idPrefix}name`}
          placeholder="Ex: Shopping Ibirapuera"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}location`}>Localização *</Label>
        <Input
          id={`${idPrefix}location`}
          placeholder="Ex: São Paulo - SP"
          value={values.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className={errors.location ? "border-destructive" : ""}
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}machineId`}>ID da Máquina *</Label>
        <Input
          id={`${idPrefix}machineId`}
          placeholder="Ex: PMC-007"
          value={values.machineId}
          onChange={(e) => handleChange("machineId", e.target.value)}
          className={errors.machineId ? "border-destructive" : ""}
        />
        {errors.machineId && (
          <p className="text-sm text-destructive">{errors.machineId}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}status`}>Status</Label>
        <Select
          value={values.status}
          onValueChange={(value: "active" | "inactive") =>
            handleChange("status", value)
          }
        >
          <SelectTrigger id={`${idPrefix}status`}>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

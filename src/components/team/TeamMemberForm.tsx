import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMemberFormData, roleLabels, statusLabels } from "@/lib/schemas/team";

interface TeamMemberFormProps {
  values: TeamMemberFormData;
  onChange: (values: TeamMemberFormData) => void;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
  idPrefix?: string;
}

export function TeamMemberForm({
  values,
  onChange,
  errors,
  onClearError,
  idPrefix = "",
}: TeamMemberFormProps) {
  const handleChange = (field: keyof TeamMemberFormData, value: string) => {
    onChange({ ...values, [field]: value });
    if (errors[field]) {
      onClearError(field);
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}name`}>Nome</Label>
        <Input
          id={`${idPrefix}name`}
          placeholder="Nome completo"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}email`}>Email</Label>
        <Input
          id={`${idPrefix}email`}
          type="email"
          placeholder="email@exemplo.com"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}role`}>Função</Label>
        <Select
          value={values.role}
          onValueChange={(value) => handleChange("role", value)}
        >
          <SelectTrigger
            id={`${idPrefix}role`}
            className={errors.role ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Selecione uma função" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(roleLabels) as Array<keyof typeof roleLabels>).map(
              (role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}status`}>Status</Label>
        <Select
          value={values.status}
          onValueChange={(value) => handleChange("status", value)}
        >
          <SelectTrigger
            id={`${idPrefix}status`}
            className={errors.status ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Selecione um status" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-destructive">{errors.status}</p>
        )}
      </div>
    </div>
  );
}

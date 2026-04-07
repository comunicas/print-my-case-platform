import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  criteria: PasswordCriteria;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const metCriteria = Object.values(criteria).filter(Boolean).length;

  let score: number;
  let label: string;
  let color: string;

  if (metCriteria <= 1) {
    score = 0;
    label = "Muito fraca";
    color = "bg-destructive";
  } else if (metCriteria === 2) {
    score = 1;
    label = "Fraca";
    color = "bg-orange-500";
  } else if (metCriteria === 3) {
    score = 2;
    label = "Média";
    color = "bg-yellow-500";
  } else if (metCriteria === 4) {
    score = 3;
    label = "Forte";
    color = "bg-lime-500";
  } else {
    score = 4;
    label = "Muito forte";
    color = "bg-green-500";
  }

  return { score, label, color, criteria };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { score, label, color, criteria } = calculatePasswordStrength(password);

  const criteriaList = [
    { key: "minLength", label: "8+ caracteres", met: criteria.minLength },
    { key: "hasUppercase", label: "Letra maiúscula (A-Z)", met: criteria.hasUppercase },
    { key: "hasLowercase", label: "Letra minúscula (a-z)", met: criteria.hasLowercase },
    { key: "hasNumber", label: "Número (0-9)", met: criteria.hasNumber },
    { key: "hasSpecial", label: "Caractere especial (!@#$%...)", met: criteria.hasSpecial },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            "font-medium",
            score === 0 && "text-destructive",
            score === 1 && "text-orange-500",
            score === 2 && "text-yellow-600",
            score === 3 && "text-lime-600",
            score === 4 && "text-green-600"
          )}>
            {label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", color)}
            style={{ width: `${((score + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-1 text-sm">
        {criteriaList.map((item) => (
          <li key={item.key} className="flex items-center gap-2">
            {item.met ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn(
              item.met ? "text-foreground" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

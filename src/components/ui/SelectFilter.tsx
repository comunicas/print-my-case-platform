import { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectFilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectFilterOption[];
  className?: string;
  triggerClassName?: string;
  testId?: string;
}

export function SelectFilter({
  value,
  onChange,
  placeholder,
  options,
  className,
  triggerClassName,
  testId,
}: SelectFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full sm:w-[160px]", triggerClassName)} data-testid={testId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.icon ? (
              <span className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </span>
            ) : (
              option.label
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

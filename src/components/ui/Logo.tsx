import { cn } from "@/lib/utils";
import logoUrl from "@/assets/logo-printmycase.svg";

type LogoVariant = "full" | "icon";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  /** Inverts to white for dark backgrounds (sidebar etc.) */
  mono?: boolean;
  alt?: string;
}

/**
 * PrintMyCase logo — padrão da aplicação.
 *
 * - `variant="full"` (default): logotipo completo em SVG vetorial.
 * - `variant="icon"`: símbolo compacto (PNG legacy do app icon).
 * - `mono`: aplica filter inverso para fundos escuros.
 *
 * Use Tailwind `h-*` ou `w-*` no `className` para dimensionar.
 */
export function Logo({
  variant = "full",
  className,
  mono = false,
  alt = "PrintMyCase",
}: LogoProps) {
  const src = variant === "icon" ? "/icon-printmycase.png" : logoUrl;

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain select-none", className)}
      style={mono ? { filter: "brightness(0) invert(1)" } : undefined}
      draggable={false}
    />
  );
}

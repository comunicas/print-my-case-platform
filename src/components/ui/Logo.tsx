import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon";
type LogoTone = "brand" | "light";

interface LogoProps {
  variant?: LogoVariant;
  tone?: LogoTone;
  className?: string;
  alt?: string;
}

// Filter calibrado para colorir o SVG branco em #9F229A (brand purple)
const BRAND_FILTER =
  "brightness(0) saturate(100%) invert(20%) sepia(96%) saturate(3461%) hue-rotate(289deg) brightness(91%) contrast(101%)";

/**
 * PrintMyCase logo — padrão da aplicação.
 *
 * - `variant="full"` (default): logotipo completo.
 * - `variant="icon"`: símbolo compacto.
 * - `tone="brand"` (default): roxo da marca (fundos claros).
 * - `tone="light"`: branco (cor nativa do SVG — fundos escuros / sidebar).
 */
export function Logo({
  variant = "full",
  tone = "brand",
  className,
  alt = "PrintMyCase",
}: LogoProps) {
  const src =
    variant === "icon" ? "/icon-printmycase.svg" : "/logo-printmycase.svg";

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={cn("object-contain select-none", className)}
      style={tone === "brand" ? { filter: BRAND_FILTER } : undefined}
    />
  );
}

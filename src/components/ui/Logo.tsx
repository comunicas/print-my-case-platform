import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon";
type LogoTone = "brand" | "light" | "dark";

interface LogoProps {
  variant?: LogoVariant;
  tone?: LogoTone;
  className?: string;
  alt?: string;
}

/**
 * PrintMyCase logo — padrão da aplicação.
 *
 * - `variant="full"` (default): logotipo completo.
 * - `variant="icon"`: símbolo compacto.
 * - `tone="brand"` (default): roxo da marca (use em fundos claros).
 * - `tone="light"`: branco (use em fundos escuros — sidebar, hero roxo).
 * - `tone="dark"`: preto (uso raro — impressões/print).
 *
 * Renderiza via CSS `mask-image`, permitindo qualquer cor sem reexportar SVG.
 * Use Tailwind `h-*` / `w-*` no `className` para dimensionar.
 */
export function Logo({
  variant = "full",
  tone = "brand",
  className,
  alt = "PrintMyCase",
}: LogoProps) {
  const src =
    variant === "icon" ? "/icon-printmycase.svg" : "/logo-printmycase.svg";

  const color =
    tone === "brand"
      ? "hsl(var(--primary))"
      : tone === "dark"
        ? "#000000"
        : "#FFFFFF";

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn("inline-block select-none", className)}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

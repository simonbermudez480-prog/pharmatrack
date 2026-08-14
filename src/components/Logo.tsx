import type { CSSProperties } from "react";
import { Isotipo } from "./Isotipo";

interface LogoProps {
  /** Altura del isotipo en píxeles. El texto se escala con él. */
  size?: number;
  /** Versión sobre fondos oscuros (texto blanco). Por defecto sobre crema. */
  variant?: "dark" | "light";
  /** Muestra el descriptivo "RECORDATORIOS DE ADHERENCIA" */
  showTagline?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Logo PharmaTrack = Isotipo (SVG) + "PharmaTrack" (serif) + tagline (sans).
 * Usamos HTML para el texto (no SVG) para evitar recortes del viewBox.
 */
export function Logo({
  size = 36,
  variant = "dark",
  showTagline = true,
  className = "",
  style,
}: LogoProps) {
  const textColor = variant === "dark" ? "#0A1F17" : "#FFFFFF";
  const taglineColor =
    variant === "dark" ? "rgba(10,31,23,0.6)" : "rgba(255,255,255,0.72)";

  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
      style={style}
      aria-label="PharmaTrack — Recordatorios de adherencia"
      role="img"
    >
      <Isotipo size={size} />
      <span className="flex flex-col leading-none">
        <span
          className="font-serif font-bold tracking-tight whitespace-nowrap"
          style={{
            color: textColor,
            fontSize: `${size * 0.6}px`,
            lineHeight: 1,
          }}
        >
          Pharma<span style={{ color: variant === "dark" ? "#0B3D2E" : "#FFFFFF" }}>Track</span>
        </span>
        {showTagline && (
          <span
            className="font-sans font-semibold uppercase mt-1 whitespace-nowrap"
            style={{
              color: taglineColor,
              fontSize: `${Math.max(8, size * 0.16)}px`,
              letterSpacing: "0.15em",
              lineHeight: 1,
            }}
          >
            Recordatorios de adherencia
          </span>
        )}
      </span>
    </span>
  );
}

export default Logo;

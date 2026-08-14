import type { SVGProps } from "react";

interface IsotipoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Isotipo suelto de PharmaTrack (cuadrado verde + cruz + check naranja).
 */
export function Isotipo({ size = 40, ...svgProps }: IsotipoProps) {
  const id = "pharmatrack-iso-clip";
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      role="img"
      aria-label="PharmaTrack"
      xmlns="http://www.w3.org/2000/svg"
      {...svgProps}
    >
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width="80" height="80" rx="18" ry="18" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width="80" height="80" rx="18" ry="18" fill="#0B3D2E" />

      <g clipPath={`url(#${id})`}>
        <rect x="33" y="14" width="14" height="52" rx="3" fill="#FFFFFF" />
        <rect x="14" y="33" width="52" height="14" rx="3" fill="#FFFFFF" />
      </g>

      <circle cx="62" cy="18" r="14" fill="#E07A3C" />
      <path
        d="M56 18.5 L60.5 23 L69 13.5"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default Isotipo;

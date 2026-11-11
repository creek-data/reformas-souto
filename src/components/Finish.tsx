import { useId } from "react";
import type { FinishKind } from "@/content/services";

/**
 * Recreación digital de un acabado (SVG con filtros de ruido e iluminación).
 * No es una fotografía de obra y no debe presentarse como tal.
 */
export function Finish({ kind, className = "" }: { kind: FinishKind; className?: string }) {
  const raw = useId().replace(/:/g, "");
  const id = (s: string) => `${raw}-${s}`;
  const common = { className: `block h-full w-full ${className}`, viewBox: "0 0 400 500", preserveAspectRatio: "xMidYMid slice", "aria-hidden": true } as const;

  const grain = (
    <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" />
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0" />
    </filter>
  );

  switch (kind) {
    case "gotele":
      return (
        <svg {...common}>
          <defs>
            <filter id={id("f")} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="8" result="n" />
              <feDiffuseLighting in="n" surfaceScale="4" lightingColor="#f6f2ea" result="l">
                <feDistantLight azimuth="225" elevation="48" />
              </feDiffuseLighting>
              <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
            </filter>
            {grain}
          </defs>
          <rect width="400" height="500" fill="#ebe5da" filter={`url(#${id("f")})`} />
          <rect width="400" height="500" filter={`url(#${id("grain")})`} />
        </svg>
      );
    case "alisado":
    case "liso":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={id("light")} cx="25%" cy="15%" r="95%">
              <stop offset="0" stopColor={kind === "liso" ? "#f4f0e8" : "#f6f3ed"} />
              <stop offset="1" stopColor={kind === "liso" ? "#ddd6c9" : "#e4ded3"} />
            </radialGradient>
            {grain}
          </defs>
          <rect width="400" height="500" fill={`url(#${id("light")})`} />
          <rect width="400" height="500" filter={`url(#${id("grain")})`} />
        </svg>
      );
    case "microcemento":
      return (
        <svg {...common}>
          <defs>
            <filter id={id("f")} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves="5" seed="21" />
              <feColorMatrix values="0 0 0 0 0.62  0 0 0 0 0.6  0 0 0 0 0.56  0 0 0 1.25 -0.38" />
            </filter>
            {grain}
          </defs>
          <rect width="400" height="500" fill="#bdb6aa" />
          <rect width="400" height="500" filter={`url(#${id("f")})`} />
          <rect width="400" height="500" filter={`url(#${id("grain")})`} />
        </svg>
      );
    case "epoxi":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={id("g")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#57534b" />
              <stop offset="1" stopColor="#3b3934" />
            </linearGradient>
            <linearGradient id={id("s")} x1="0" y1="0" x2="1" y2="0.35">
              <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.48" stopColor="#fff" stopOpacity="0.22" />
              <stop offset="0.56" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="400" height="500" fill={`url(#${id("g")})`} />
          <rect width="400" height="500" fill={`url(#${id("s")})`} />
          <ellipse cx="300" cy="90" rx="160" ry="22" fill="#fff" opacity="0.06" />
        </svg>
      );
    case "lacado":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={id("g")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#efebe3" />
              <stop offset="0.55" stopColor="#f8f6f1" />
              <stop offset="1" stopColor="#e6e0d5" />
            </linearGradient>
          </defs>
          <rect width="400" height="500" fill={`url(#${id("g")})`} />
          <g fill="none" stroke="#d3cbbd" strokeWidth="2">
            <rect x="70" y="60" width="260" height="170" rx="2" />
            <rect x="70" y="270" width="260" height="170" rx="2" />
          </g>
          <g fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.8">
            <path d="M72 62h256M72 272h256" />
          </g>
        </svg>
      );
    case "papel":
      return (
        <svg {...common}>
          <defs>
            <pattern id={id("p")} width="40" height="500" patternUnits="userSpaceOnUse">
              <rect width="40" height="500" fill="#e8e1d3" />
              <rect x="0" width="14" height="500" fill="#ded5c4" />
              <rect x="22" width="1.5" height="500" fill="#d2c8b5" />
            </pattern>
            {grain}
          </defs>
          <rect width="400" height="500" fill={`url(#${id("p")})`} />
          <rect width="400" height="500" filter={`url(#${id("grain")})`} />
        </svg>
      );
    case "pladur":
      return (
        <svg {...common}>
          <rect width="400" height="500" fill="#e2ddd4" />
          <g fill="#ebe7df">
            <rect x="0" width="130" height="500" />
            <rect x="270" width="130" height="500" />
          </g>
          <g fill="#f3f0ea">
            <rect x="124" width="12" height="500" />
            <rect x="264" width="12" height="500" />
          </g>
          <g stroke="#cfc8bb" strokeWidth="1">
            <path d="M130 0v500M270 0v500" />
          </g>
        </svg>
      );
    case "obra":
      return (
        <svg {...common}>
          <defs>
            <pattern id={id("t")} width="100" height="50" patternUnits="userSpaceOnUse">
              <rect width="100" height="50" fill="#e5ded1" />
              <path d="M0 49.5h100M99.5 0v50" stroke="#f4f0e8" strokeWidth="2" />
            </pattern>
            {grain}
          </defs>
          <rect width="400" height="500" fill={`url(#${id("t")})`} />
          <rect width="400" height="500" filter={`url(#${id("grain")})`} />
        </svg>
      );
    case "madera":
      return (
        <svg {...common}>
          <defs>
            <filter id={id("f")} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.004 0.12" numOctaves="3" seed="5" />
              <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.22  0 0 0 0.9 -0.25" />
            </filter>
          </defs>
          <rect width="400" height="500" fill="#a58a6c" />
          <rect width="400" height="500" filter={`url(#${id("f")})`} />
        </svg>
      );
  }
}

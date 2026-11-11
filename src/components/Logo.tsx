/**
 * Logotipo redibujado en vector a partir del original (tejado dorado de dos
 * aguas con chimenea, «SOUTO» y «Pinturas y Proyectos»). Si la empresa tiene
 * el archivo vectorial original, sustituir aquí.
 */
export function RoofMark({ className = "", strokeWidth = 4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 120 52" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="miter" aria-hidden="true">
      <path d="M2 50 L58 6 L92 32" />
      <path d="M50 12 L72 2 L118 40" />
      <path d="M16 39 V20 H26 V31" />
    </svg>
  );
}

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <RoofMark className={`-mb-[3px] ml-[2px] h-[15px] w-auto ${light ? "text-bronce-claro" : "text-bronce"}`} strokeWidth={5} />
      <span className={`font-sans text-[1.55rem] font-[750] tracking-[0.04em] ${light ? "text-cal" : "text-grafito"}`}>SOUTO</span>
      <span className={`mt-[3px] text-[0.55rem] font-medium uppercase tracking-[0.2em] ${light ? "text-cal/70" : "text-gris"}`}>
        Pinturas y Proyectos
      </span>
    </span>
  );
}

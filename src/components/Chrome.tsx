"use client";

import { usePathname } from "next/navigation";

/** Cabecera, pie y barra móvil de la web pública; el panel no los lleva. */
export function Chrome({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/panel") ? null : <>{children}</>;
}

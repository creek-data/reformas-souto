import { CATALOG_VERSION, catalog, type CatalogItem } from "@/content/catalog";

/**
 * Motor de estimación determinista. Solo usa precios del catálogo validado.
 * Los ajustes comerciales (rango, mínimo, desplazamiento, recargos por estado
 * de la superficie) están preparados pero desactivados (null) hasta que la
 * empresa los valide: mientras tanto se informan como factores sin cuantificar.
 */

export interface PricingSettings {
  /** % por debajo y por encima de la base para mostrar un rango. null = mostrar «desde». */
  rangeLowPct: number | null;
  rangeHighPct: number | null;
  /** Importe mínimo por trabajo, en céntimos. */
  minimumCents: number | null;
  /** Desplazamiento fuera de Madrid, en céntimos. */
  travelFeeCents: number | null;
  /** Multiplicador por estado de la superficie (p. ej. 1.15 si tiene desperfectos). */
  conditionFactor: Partial<Record<SurfaceCondition, number>> | null;
}

export const pendingSettings: PricingSettings = {
  rangeLowPct: null,
  rangeHighPct: null,
  minimumCents: null,
  travelFeeCents: null,
  conditionFactor: null,
};

export type SurfaceCondition = "buena" | "desperfectos" | "no-se";
export type Location = "madrid" | "fuera";

export interface EstimateInputLine {
  code: string;
  qty: number;
}

export interface EstimateContext {
  condition?: SurfaceCondition;
  location?: Location;
}

export interface EstimateLine {
  code: string;
  name: string;
  unit: CatalogItem["unit"];
  qty: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface Estimate {
  catalogVersion: string;
  lines: EstimateLine[];
  baseCents: number;
  rangeCents: { low: number; high: number } | null;
  /** Factores que pueden mover el precio y aún no están cuantificados. */
  pendingFactors: string[];
}

export const MAX_QTY = 5000;

export class EstimateError extends Error {}

export function estimate(
  input: EstimateInputLine[],
  context: EstimateContext = {},
  settings: PricingSettings = pendingSettings,
): Estimate {
  if (input.length === 0) throw new EstimateError("Sin partidas");
  const seen = new Set<string>();
  const lines: EstimateLine[] = input.map(({ code, qty }) => {
    const item = catalog.find((i) => i.code === code);
    if (!item) throw new EstimateError(`Partida desconocida: ${code}`);
    if (seen.has(code)) throw new EstimateError(`Partida repetida: ${code}`);
    seen.add(code);
    if (!Number.isFinite(qty) || qty <= 0 || qty > MAX_QTY) throw new EstimateError(`Cantidad no válida en ${code}`);
    const q = item.unit === "ud" ? Math.round(qty) : Math.round(qty * 100) / 100;
    if (q <= 0) throw new EstimateError(`Cantidad no válida en ${code}`);
    const factor = (context.condition && settings.conditionFactor?.[context.condition]) ?? 1;
    const unitPriceCents = Math.round(item.basePriceCents * factor);
    return { code, name: item.name, unit: item.unit, qty: q, unitPriceCents, totalCents: Math.round(unitPriceCents * q) };
  });

  let baseCents = lines.reduce((s, l) => s + l.totalCents, 0);
  const pendingFactors: string[] = [];

  if (context.location === "fuera") {
    if (settings.travelFeeCents != null) baseCents += settings.travelFeeCents;
    else pendingFactors.push("El desplazamiento fuera de Madrid");
  }
  if (settings.minimumCents != null) baseCents = Math.max(baseCents, settings.minimumCents);
  if (context.condition !== "buena" && !settings.conditionFactor) {
    pendingFactors.push("El estado de las superficies, que revisamos en la visita");
  }

  const rangeCents =
    settings.rangeLowPct != null && settings.rangeHighPct != null
      ? {
          low: Math.round(baseCents * (1 - settings.rangeLowPct / 100)),
          high: Math.round(baseCents * (1 + settings.rangeHighPct / 100)),
        }
      : null;

  return { catalogVersion: CATALOG_VERSION, lines, baseCents, rangeCents, pendingFactors };
}

/** m² de paredes de una habitación rectangular (sin descontar huecos) y de techo. */
export function roomAreas(lengthM: number, widthM: number, heightM: number) {
  const ok = [lengthM, widthM, heightM].every((n) => Number.isFinite(n) && n > 0 && n < 100);
  if (!ok) return null;
  const walls = 2 * (lengthM + widthM) * heightM;
  const ceiling = lengthM * widthM;
  return { walls: Math.round(walls * 100) / 100, ceiling: Math.round(ceiling * 100) / 100 };
}

export const formatEuros = (cents: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    useGrouping: "always",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

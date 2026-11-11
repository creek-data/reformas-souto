/**
 * Catálogo de precios base VALIDADO por la empresa (PDFs «plantilla de precios»
 * de 23/09/2026 y «tabla de precios» de 07/10/2026). Precios sin IVA, en céntimos.
 * No añadir partidas ni precios sin confirmación escrita de la empresa.
 */

export type Unit = "m2" | "ud" | "ml";

export type CategoryId = "paredes" | "carpinteria" | "suelos" | "pladur" | "reformas" | "muebles";

export interface CatalogItem {
  code: string;
  category: CategoryId;
  name: string;
  unit: Unit;
  basePriceCents: number;
  /** Qué incluye, según la descripción de la propia empresa. */
  includes: string;
  /** Aclaración de la empresa sobre materiales, si existe. */
  materialNote?: string;
  /** Partida de pared o techo: permite calcular m² por medidas de la habitación. */
  surface?: "pared" | "suelo";
}

export const CATALOG_VERSION = "2026-10-07";

export const catalog: CatalogItem[] = [
  { code: "pintura-liso", category: "paredes", name: "Pintura en liso", unit: "m2", basePriceCents: 670, surface: "pared",
    includes: "Saneamiento de fallos y grietas y aplicación de pintura plástica lavable." },
  { code: "pintura-gotele", category: "paredes", name: "Pintura en gotelé", unit: "m2", basePriceCents: 720, surface: "pared",
    includes: "Saneamiento y aplicación de gota con acabado en pintura plástica lavable." },
  { code: "alisado-gotele", category: "paredes", name: "Alisado de gotelé", unit: "m2", basePriceCents: 1500, surface: "pared",
    includes: "Tres capas de emplaste, lijado, una mano de imprimación, corrección de fallos y dos capas de pintura plástica lavable." },
  { code: "papel-pintado", category: "paredes", name: "Instalación de papel pintado", unit: "m2", basePriceCents: 1700, surface: "pared",
    includes: "Colocación de papel pintado." },
  { code: "esmaltado-puertas", category: "carpinteria", name: "Esmaltado de puertas", unit: "ud", basePriceCents: 9000,
    includes: "Saneamiento de pequeños fallos, una mano de imprimación, lijado y dos manos de esmalte sintético o al agua." },
  { code: "esmaltado-metal", category: "carpinteria", name: "Esmaltado de piezas metálicas", unit: "m2", basePriceCents: 1800,
    includes: "Lijado del hierro, una capa de imprimación y dos capas de esmalte sintético o al agua." },
  { code: "pintura-epoxi", category: "suelos", name: "Pintura epoxi", unit: "m2", basePriceCents: 2000, surface: "suelo",
    includes: "Aplicación de pintura epoxi de doble componente." },
  { code: "resina-epoxi", category: "suelos", name: "Resina epoxi autonivelante", unit: "m2", basePriceCents: 3250, surface: "suelo",
    includes: "Resina epoxi autonivelante.", materialNote: "El precio puede variar según el color." },
  { code: "microcemento-sin-malla", category: "suelos", name: "Microcemento sin malla", unit: "m2", basePriceCents: 6000, surface: "suelo",
    includes: "Preparación de la superficie, tres capas de microcemento y dos capas de barniz de poliuretano." },
  { code: "microcemento-con-malla", category: "suelos", name: "Microcemento con malla y base", unit: "m2", basePriceCents: 7000, surface: "suelo",
    includes: "Preparación con malla y base, tres capas de microcemento y barniz de poliuretano." },
  { code: "pladur-lana-roca", category: "pladur", name: "Placa de pladur con lana de roca", unit: "m2", basePriceCents: 3000, surface: "pared",
    includes: "Instalación de pladur doble capa con lana de roca.", materialNote: "Solo mano de obra." },
  { code: "encintado", category: "pladur", name: "Encintado de pladur", unit: "m2", basePriceCents: 450, surface: "pared",
    includes: "Cinta y tres manos de pasta de junta. Acabado listo para lijar y pintar.", materialNote: "Con materiales." },
  { code: "guardavivo", category: "pladur", name: "Cinta guardavivo", unit: "ml", basePriceCents: 550,
    includes: "Guardavivo en esquinas con tres capas de pasta, listo para lijar y pintar." },
  { code: "pintura-pladur", category: "pladur", name: "Pintura en pladur", unit: "m2", basePriceCents: 670, surface: "pared",
    includes: "Lijado, una capa de imprimación, corrección de fallos y pintura plástica." },
];

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  /** false = no hay precios validados: se ofrece visita para presupuestar. */
  priced: boolean;
}

export const categories: Category[] = [
  { id: "paredes", name: "Paredes y techos", short: "Pintura, alisado de gotelé y papel pintado", priced: true },
  { id: "carpinteria", name: "Puertas y metal", short: "Lacados y esmaltes", priced: true },
  { id: "suelos", name: "Suelos y revestimientos", short: "Microcemento, epoxi y resinas", priced: true },
  { id: "pladur", name: "Pladur", short: "Tabiques, encintado y pintura", priced: true },
  { id: "reformas", name: "Reformas", short: "Baños, fontanería y albañilería", priced: false },
  { id: "muebles", name: "Restauración de muebles", short: "Recuperar y lacar piezas", priced: false },
];

export const unitLabel: Record<Unit, string> = { m2: "m²", ud: "ud", ml: "m" };

export const findItem = (code: string) => catalog.find((i) => i.code === code);

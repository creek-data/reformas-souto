import type { CategoryId } from "./catalog";

/**
 * Páginas de servicio. Los textos describen lo que la empresa ha confirmado
 * que hace y los procesos de sus propios presupuestos. Sin años de
 * experiencia, cifras ni promesas no verificadas.
 */

export type FinishKind = "liso" | "gotele" | "alisado" | "lacado" | "microcemento" | "epoxi" | "papel" | "pladur" | "obra" | "madera";

export interface Service {
  slug: string;
  name: string;
  /** Título SEO (sin el nombre de marca, que se añade solo). */
  seoTitle: string;
  description: string;
  lead: string;
  /** Pasos del proceso tal y como los describe la empresa. */
  process: string[];
  /** Partidas del catálogo validado que se muestran con su precio base. */
  items: string[];
  category: CategoryId;
  finish: FinishKind;
  priced: boolean;
}

export const services: Service[] = [
  {
    slug: "pintura",
    name: "Pintura de interiores",
    seoTitle: "Pintores en Madrid: pintura de pisos, paredes y techos",
    description: "Pintura de paredes y techos en liso o gotelé, con saneado previo de fallos y grietas. Presupuesto por partidas y sin compromiso en Madrid.",
    lead: "Paredes y techos en liso o en gotelé. Antes de pintar saneamos fallos y grietas, porque el acabado depende de lo que hay debajo.",
    process: ["Protección de suelos y muebles", "Saneamiento de fallos y grietas", "Pintura plástica lavable"],
    items: ["pintura-liso", "pintura-gotele"],
    category: "paredes",
    finish: "liso",
    priced: true,
  },
  {
    slug: "alisado-de-gotele",
    name: "Alisado de gotelé",
    seoTitle: "Quitar y alisar gotelé en Madrid",
    description: "Alisado de gotelé con tres capas de emplaste, lijado, imprimación y dos manos de pintura plástica lavable. Calcula tu precio orientativo.",
    lead: "Convertimos paredes de gotelé en superficies lisas, capa a capa, hasta que no queda rastro de la gota.",
    process: ["Tres capas de emplaste", "Lijado", "Una mano de imprimación", "Corrección de fallos", "Dos capas de pintura plástica lavable"],
    items: ["alisado-gotele"],
    category: "paredes",
    finish: "alisado",
    priced: true,
  },
  {
    slug: "lacados-y-esmaltes",
    name: "Lacados y esmaltes",
    seoTitle: "Lacado y esmaltado de puertas en Madrid",
    description: "Esmaltado de puertas y piezas metálicas con imprimación y dos manos de esmalte sintético o al agua. Presupuesto sin compromiso.",
    lead: "Puertas, carpintería y piezas metálicas con un acabado esmaltado, sintético o al agua.",
    process: ["Saneamiento de pequeños fallos o lijado del hierro", "Una mano de imprimación", "Lijado", "Dos manos de esmalte sintético o al agua"],
    items: ["esmaltado-puertas", "esmaltado-metal"],
    category: "carpinteria",
    finish: "lacado",
    priced: true,
  },
  {
    slug: "microcemento",
    name: "Microcemento",
    seoTitle: "Microcemento en Madrid: suelos y paredes sin juntas",
    description: "Aplicación de microcemento con o sin malla, tres capas y sellado con barniz de poliuretano. Calcula tu precio orientativo por m².",
    lead: "Un revestimiento continuo, sin juntas, para suelos y paredes. Con malla y base cuando el soporte lo pide.",
    process: ["Preparación de la superficie (con malla y base si hace falta)", "Tres capas de microcemento", "Barniz de poliuretano"],
    items: ["microcemento-sin-malla", "microcemento-con-malla"],
    category: "suelos",
    finish: "microcemento",
    priced: true,
  },
  {
    slug: "suelos-epoxi",
    name: "Suelos epoxi y resinas",
    seoTitle: "Pintura epoxi y resina autonivelante en Madrid",
    description: "Pintura epoxi de doble componente y resina epoxi autonivelante. Precio orientativo por m² y presupuesto sin compromiso.",
    lead: "Pintura epoxi de doble componente y resina autonivelante, para superficies que tienen que resistir.",
    process: ["Preparación del soporte", "Aplicación de epoxi de doble componente o resina autonivelante"],
    items: ["pintura-epoxi", "resina-epoxi"],
    category: "suelos",
    finish: "epoxi",
    priced: true,
  },
  {
    slug: "papel-pintado",
    name: "Papel pintado",
    seoTitle: "Colocación de papel pintado en Madrid",
    description: "Instalación de papel pintado en paredes. Precio orientativo por m² y presupuesto sin compromiso.",
    lead: "Colocación de papel pintado, con la pared preparada para que el papel asiente sin defectos.",
    process: ["Revisión y preparación de la pared", "Colocación del papel"],
    items: ["papel-pintado"],
    category: "paredes",
    finish: "papel",
    priced: true,
  },
  {
    slug: "pladur",
    name: "Pladur",
    seoTitle: "Tabiques de pladur con lana de roca en Madrid",
    description: "Instalación de pladur doble capa con lana de roca, encintado, guardavivos y pintura. Precio orientativo por partidas.",
    lead: "Tabiques y trasdosados de pladur en doble capa con lana de roca, encintados y listos para pintar.",
    process: ["Placa de pladur doble capa con lana de roca", "Encintado con tres manos de pasta", "Guardavivos en esquinas", "Imprimación y pintura"],
    items: ["pladur-lana-roca", "encintado", "guardavivo", "pintura-pladur"],
    category: "pladur",
    finish: "pladur",
    priced: true,
  },
  {
    slug: "reformas",
    name: "Reformas",
    seoTitle: "Reformas de baños, fontanería y albañilería en Madrid",
    description: "Reformas generales: baños, fontanería y albañilería, con equipo propio y colaboradores. Visita y presupuesto sin compromiso.",
    lead: "Baños, fontanería, albañilería y reformas generales de vivienda. Cada reforma es distinta: la vemos en persona y te damos un presupuesto por partidas.",
    process: ["Visita para valorar el trabajo", "Presupuesto por partidas", "Ejecución con equipo propio y colaboradores"],
    items: [],
    category: "reformas",
    finish: "obra",
    priced: false,
  },
  {
    slug: "restauracion-de-muebles",
    name: "Restauración de muebles",
    seoTitle: "Restauración y lacado de muebles en Madrid",
    description: "Restauración y lacado de muebles. Valoramos cada pieza y te damos presupuesto sin compromiso.",
    lead: "Recuperamos muebles y piezas de madera. Cada pieza es distinta, así que la valoramos antes de darte precio.",
    process: ["Valoración de la pieza", "Presupuesto", "Restauración y acabado"],
    items: [],
    category: "muebles",
    finish: "madera",
    priced: false,
  },
];

export const findService = (slug: string) => services.find((s) => s.slug === slug);

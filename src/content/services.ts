import type { CategoryGroup, CategoryId } from "./catalog";

/**
 * Páginas de servicio. Los textos describen lo que la empresa ha confirmado
 * que hace y los procesos de sus propios presupuestos. Sin años de
 * experiencia, cifras ni promesas no verificadas.
 */

export type FinishKind = "liso" | "gotele" | "alisado" | "lacado" | "microcemento" | "epoxi" | "papel" | "pladur" | "obra" | "madera";

export interface Faq {
  q: string;
  a: string;
}

export interface Service {
  slug: string;
  name: string;
  group: CategoryGroup;
  /** Título SEO (sin el nombre de marca, que se añade solo). */
  seoTitle: string;
  description: string;
  /** Frase corta para listados. */
  lead: string;
  /** Párrafo de la página del servicio: para quién es y qué resuelve. */
  intro: string;
  /** Pasos del proceso tal y como los describe la empresa. */
  process: string[];
  /** Partidas del catálogo validado que se muestran con su precio base. */
  items: string[];
  category: CategoryId;
  finish: FinishKind;
  priced: boolean;
  faqs?: Faq[];
}

export const services: Service[] = [
  {
    slug: "pintura",
    name: "Pintura de interiores",
    group: "acabados",
    seoTitle: "Pintores en Madrid: pintura de pisos, paredes y techos",
    description: "Pintura de paredes y techos en liso o gotelé, con saneado previo de fallos y grietas. Precio base publicado y presupuesto por partidas en Madrid.",
    lead: "Paredes y techos en liso o en gotelé, con las grietas saneadas antes de pintar.",
    intro:
      "Pintar parece sencillo hasta que aparecen las grietas, las manchas o la pared que absorbe la pintura. Protegemos suelos y muebles, saneamos lo que haga falta y aplicamos pintura plástica lavable, para que el color dure y se pueda limpiar.",
    process: ["Protección de suelos y muebles", "Saneamiento de fallos y grietas", "Pintura plástica lavable"],
    items: ["pintura-liso", "pintura-gotele"],
    category: "paredes",
    finish: "liso",
    priced: true,
    faqs: [
      { q: "¿Cómo calculo los metros de pared?", a: "En la calculadora puedes meter el largo, el ancho y el alto de cada habitación y te sale la superficie de paredes, o de paredes y techo. Es una medida aproximada: en la visita la ajustamos." },
      { q: "¿Qué pintura usáis?", a: "Pintura plástica lavable. Si quieres un color o una marca concreta, dínoslo y lo tenemos en cuenta en el presupuesto." },
    ],
  },
  {
    slug: "alisado-de-gotele",
    name: "Alisado de gotelé",
    group: "acabados",
    seoTitle: "Quitar y alisar gotelé en Madrid",
    description: "Alisado de gotelé con tres capas de emplaste, lijado, imprimación y dos manos de pintura plástica lavable. Calcula tu precio orientativo.",
    lead: "Paredes de gotelé que quedan lisas, capa a capa, sin rastro de la gota.",
    intro:
      "El gotelé no se quita de un día para otro: se cubre. Damos tres capas de emplaste, lijamos, imprimamos, corregimos cualquier fallo y terminamos con dos manos de pintura. Es el trabajo que más cambia una casa con menos obra.",
    process: ["Tres capas de emplaste", "Lijado", "Una mano de imprimación", "Corrección de fallos", "Dos capas de pintura plástica lavable"],
    items: ["alisado-gotele"],
    category: "paredes",
    finish: "alisado",
    priced: true,
    faqs: [
      { q: "¿Se puede alisar con los muebles dentro?", a: "Sí: los movemos al centro y los protegemos. Lo concretamos en la visita según cómo esté la casa." },
      { q: "¿El precio incluye la pintura final?", a: "Sí. El precio base del alisado incluye las dos capas de pintura plástica lavable." },
    ],
  },
  {
    slug: "lacados-y-esmaltes",
    name: "Lacados y esmaltes",
    group: "acabados",
    seoTitle: "Lacado y esmaltado de puertas en Madrid",
    description: "Esmaltado de puertas y piezas metálicas con imprimación y dos manos de esmalte sintético o al agua. Precio por puerta y presupuesto sin compromiso.",
    lead: "Puertas, rejas y barandillas como nuevas, con esmalte sintético o al agua.",
    intro:
      "Cambiar las puertas es caro; lacarlas, no tanto. Saneamos los golpes, imprimamos, lijamos y damos dos manos de esmalte. También en hierro: rejas, barandillas y radiadores.",
    process: ["Saneamiento de pequeños fallos o lijado del hierro", "Una mano de imprimación", "Lijado", "Dos manos de esmalte sintético o al agua"],
    items: ["esmaltado-puertas", "esmaltado-metal"],
    category: "carpinteria",
    finish: "lacado",
    priced: true,
    faqs: [
      { q: "¿Sintético o al agua?", a: "El esmalte al agua huele menos y amarillea menos; el sintético es muy resistente. En la visita te recomendamos el que mejor encaja con tu puerta." },
    ],
  },
  {
    slug: "microcemento",
    name: "Microcemento",
    group: "acabados",
    seoTitle: "Microcemento en Madrid: suelos y paredes sin juntas",
    description: "Aplicación de microcemento con o sin malla, tres capas y sellado con barniz de poliuretano. Calcula tu precio orientativo por m².",
    lead: "Suelos y paredes continuos, sin juntas, sellados con poliuretano.",
    intro:
      "El microcemento da un acabado continuo, sin juntas, que funciona en suelos, paredes y baños. Si el soporte lo necesita, ponemos malla y base antes de las tres capas, y lo sellamos con barniz de poliuretano.",
    process: ["Preparación de la superficie (con malla y base si hace falta)", "Tres capas de microcemento", "Barniz de poliuretano"],
    items: ["microcemento-sin-malla", "microcemento-con-malla"],
    category: "suelos",
    finish: "microcemento",
    priced: true,
    faqs: [
      { q: "¿Con malla o sin malla?", a: "Depende del soporte. Si hay juntas o riesgo de fisuras, la malla y la base dan estabilidad. Lo decidimos al verlo, y en la calculadora puedes comparar los dos precios." },
    ],
  },
  {
    slug: "suelos-epoxi",
    name: "Suelos epoxi y resinas",
    group: "acabados",
    seoTitle: "Pintura epoxi y resina autonivelante en Madrid",
    description: "Pintura epoxi de doble componente y resina epoxi autonivelante para garajes, locales y trasteros. Precio orientativo por m².",
    lead: "Epoxi de doble componente y resina autonivelante para suelos que se usan mucho.",
    intro:
      "Para garajes, locales, trasteros o cualquier suelo que tenga que aguantar. La pintura epoxi de doble componente protege y se limpia con facilidad; la resina autonivelante deja una superficie continua y lisa.",
    process: ["Preparación del soporte", "Aplicación de epoxi de doble componente o resina autonivelante"],
    items: ["pintura-epoxi", "resina-epoxi"],
    category: "suelos",
    finish: "epoxi",
    priced: true,
  },
  {
    slug: "papel-pintado",
    name: "Papel pintado",
    group: "acabados",
    seoTitle: "Colocación de papel pintado en Madrid",
    description: "Instalación de papel pintado en paredes, con la pared preparada antes. Precio orientativo por m² y presupuesto sin compromiso.",
    lead: "Papel pintado bien asentado, sobre una pared preparada.",
    intro:
      "Un papel pintado solo queda bien si la pared está bien. La revisamos y la preparamos antes de colocarlo, para que no se marquen juntas, bultos ni irregularidades.",
    process: ["Revisión y preparación de la pared", "Colocación del papel"],
    items: ["papel-pintado"],
    category: "paredes",
    finish: "papel",
    priced: true,
  },
  {
    slug: "pladur",
    name: "Pladur",
    group: "acabados",
    seoTitle: "Tabiques de pladur con lana de roca en Madrid",
    description: "Instalación de pladur doble capa con lana de roca, encintado, guardavivos y pintura. Precio orientativo por partidas.",
    lead: "Tabiques y trasdosados de doble capa con lana de roca, listos para pintar.",
    intro:
      "Dividir una habitación, ganar aislamiento o esconder instalaciones. Montamos pladur en doble capa con lana de roca, encintamos con tres manos de pasta, protegemos las esquinas con guardavivos y lo dejamos pintado.",
    process: ["Placa de pladur doble capa con lana de roca", "Encintado con tres manos de pasta", "Guardavivos en esquinas", "Imprimación y pintura"],
    items: ["pladur-lana-roca", "encintado", "guardavivo", "pintura-pladur"],
    category: "pladur",
    finish: "pladur",
    priced: true,
    faqs: [
      { q: "¿El precio del pladur incluye material?", a: "La placa con lana de roca es solo mano de obra; el encintado incluye materiales. Lo verás separado en el presupuesto." },
    ],
  },
  {
    slug: "restauracion-de-muebles",
    name: "Restauración de muebles",
    group: "acabados",
    seoTitle: "Restauración y lacado de muebles en Madrid",
    description: "Restauración y lacado de muebles de madera. Valoramos cada pieza y te damos presupuesto sin compromiso.",
    lead: "Muebles de madera recuperados y lacados, pieza a pieza.",
    intro:
      "Ese aparador de la familia o la cómoda que no quieres tirar. Cada pieza es distinta, así que la vemos antes de darte precio y te contamos qué se puede hacer con ella.",
    process: ["Valoración de la pieza", "Presupuesto", "Restauración y acabado"],
    items: [],
    category: "muebles",
    finish: "madera",
    priced: false,
  },
  {
    slug: "reformas",
    name: "Reformas de vivienda y local",
    group: "reformas",
    seoTitle: "Reformas de pisos y locales en Madrid",
    description: "Reformas de vivienda y local con un único presupuesto por partidas: albañilería, fontanería, pladur y pintura. Visita sin compromiso en Madrid.",
    lead: "Varios oficios en una sola obra, con un único presupuesto.",
    intro:
      "Cuando una obra junta albañilería, fontanería, pladur y pintura, lo difícil es coordinarla. Nos encargamos nosotros, con equipo propio y colaboradores, y te damos un único presupuesto por partidas para que sepas qué pagas en cada parte.",
    process: ["Visita para ver la obra y tomar medidas", "Presupuesto por partidas, por escrito", "Obra con equipo propio y colaboradores"],
    items: [],
    category: "reformas",
    finish: "obra",
    priced: false,
  },
  {
    slug: "reformas-de-bano",
    name: "Reformas de baño",
    group: "reformas",
    seoTitle: "Reformas de baño en Madrid",
    description: "Cambio de bañera por plato de ducha y reformas completas de baño en Madrid: fontanería, albañilería y acabados. Reserva la visita online.",
    lead: "De cambiar la bañera por un plato de ducha a rehacer el baño entero.",
    intro:
      "Un baño junta fontanería, albañilería y acabados en pocos metros. Lo vemos contigo, te damos un presupuesto por partidas y coordinamos todos los oficios para que no tengas que tratar con cada uno por separado.",
    process: ["Visita para ver el baño y tomar medidas", "Presupuesto por partidas, por escrito", "Obra: fontanería, albañilería y acabados"],
    items: [],
    category: "banos",
    finish: "obra",
    priced: false,
    faqs: [
      { q: "¿Por qué no hay precio online para baños?", a: "Porque cambia mucho según el estado de las tuberías, los materiales y lo que quieras hacer. Preferimos verlo y darte un precio cerrado por partidas que publicar uno que luego no se cumpla." },
    ],
  },
  {
    slug: "fontaneria",
    name: "Fontanería",
    group: "reformas",
    seoTitle: "Fontanería en Madrid: tuberías, sanitarios y grifería",
    description: "Trabajos de fontanería en Madrid: tuberías, desagües, sanitarios y grifería. Visita y presupuesto por partidas sin compromiso.",
    lead: "Tuberías, desagües, sanitarios y grifería.",
    intro:
      "Cambiar tuberías antiguas, mover un desagüe o instalar sanitarios y grifería. Lo vemos en la visita, te explicamos qué hace falta y te lo presupuestamos por partidas.",
    process: ["Visita para ver la instalación", "Presupuesto por partidas, por escrito", "Trabajo de fontanería"],
    items: [],
    category: "fontaneria",
    finish: "obra",
    priced: false,
  },
  {
    slug: "albanileria",
    name: "Albañilería",
    group: "reformas",
    seoTitle: "Albañilería en Madrid: tabiques, alicatados y solados",
    description: "Trabajos de albañilería en Madrid: tabiques, alicatados, solados y remates. Visita y presupuesto por partidas sin compromiso.",
    lead: "Tabiques, alicatados, solados y remates de obra.",
    intro:
      "Obra pequeña o parte de una reforma más grande: levantar o tirar un tabique, alicatar, solar o rematar lo que ha quedado a medias. Lo vemos y te damos precio por partidas.",
    process: ["Visita para ver la obra", "Presupuesto por partidas, por escrito", "Trabajo de albañilería"],
    items: [],
    category: "albanileria",
    finish: "obra",
    priced: false,
  },
];

export const findService = (slug: string) => services.find((s) => s.slug === slug);
export const servicesIn = (g: CategoryGroup) => services.filter((s) => s.group === g);

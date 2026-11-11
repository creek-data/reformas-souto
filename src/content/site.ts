/**
 * Datos de la empresa y banderas de contenido.
 * REGLA: aquí solo entran datos verificados. Lo que falta se deja en null
 * y la interfaz no lo muestra.
 */

export const site = {
  brand: "Souto",
  name: "Souto Pinturas y Proyectos",
  legalName: "Souto Pinturas y Proyectos SL",
  cif: "B44682839",
  /** Domicilio social (BORME-A-2023-34-28 y presupuestos de la empresa). Solo se muestra en el aviso legal. */
  legalAddress: "Avenida de Oporto 24, 28019 Madrid",
  /** Datos registrales (tomo, folio, hoja). Pendiente: pedir a la gestoría. */
  registryData: null as string | null,
  /** Número de registro empresarial de la Comunidad de Madrid, si lo tienen. Pendiente. */
  madridBusinessRegistry: null as string | null,
  phone: "+34691567430",
  phoneDisplay: "691 567 430",
  whatsapp: "34691567430",
  email: "soutoproyectospinturas@gmail.com",
  instagram: "https://www.instagram.com/soutopinturasproyectos/",
  instagramHandle: "@soutopinturasproyectos",
  area: "Madrid y alrededores",
  areaLong:
    "Trabajamos en Madrid capital y también fuera. Si la obra está fuera de Madrid, el desplazamiento va indicado en el presupuesto desde el principio.",
  /** Desplazamiento fuera de Madrid: importe pendiente de validar con la empresa. */
  travelFeeNote: "Se indica en el presupuesto según la ubicación de la obra.",
} as const;

/**
 * Secciones preparadas en el código pero ocultas hasta tener contenido real y
 * permisos. Activar solo con material verificado.
 */
export const features = {
  /** Galería de proyectos propios. Requiere fotos reales y permiso de los clientes. */
  projects: false,
  /** Comparador antes/después. Requiere pares de fotos reales. */
  beforeAfter: false,
  /** Empresas que han confiado en Souto. Requiere permiso expreso de cada empresa. */
  clients: false,
  /** Opiniones. Requiere reseñas reales con autorización. */
  testimonials: false,
} as const;

export const whatsappUrl = (text = "Hola, quería pedir presupuesto.") =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

/**
 * URL pública. SITE_URL manda; si no está, se usa la que Netlify inyecta en
 * cada despliegue (URL = dominio principal del proyecto).
 */
export const siteUrl = (process.env.SITE_URL || process.env.URL || "http://localhost:3000").replace(/\/$/, "");

/** Mientras no se lance, la web no se indexa (SITE_INDEXABLE=true para abrirla). */
export const indexable = process.env.SITE_INDEXABLE === "true";

/** Versión del texto de consentimiento que se guarda con cada solicitud. */
export const consentVersion = "2026-11-11";

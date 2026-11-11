/**
 * Contenido pendiente de material real y de permisos. Las listas se publican
 * solo cuando tienen elementos Y la bandera correspondiente de `features`
 * (src/content/site.ts) está activada.
 *
 * - clients: la empresa ha nombrado clientes (Proyecta Construcción, Eseka
 *   Servicios de Arquitectura, Amezkua Studio y otra consultora), pero falta
 *   su permiso expreso para mostrarlos y sus logotipos oficiales.
 * - testimonials: solo reseñas reales, con nombre autorizado y fuente.
 * - projects / beforeAfter: solo fotos de obras propias, con permiso del cliente.
 */

export interface ClientRef {
  name: string;
  /** Ruta en /public/clientes/ del logotipo facilitado por el cliente. */
  logo?: string;
  url?: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  /** Dónde se publicó la reseña (p. ej. Google), para poder verificarla. */
  source: string;
}

export interface Project {
  slug: string;
  title: string;
  location: string;
  services: string[];
  cover: string;
  images: string[];
}

export interface BeforeAfterPair {
  before: string;
  after: string;
  alt: string;
  caption: string;
}

export const clients: ClientRef[] = [];
export const testimonials: Testimonial[] = [];
export const projects: Project[] = [];
export const beforeAfter: BeforeAfterPair[] = [];

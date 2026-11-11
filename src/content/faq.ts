import type { Faq } from "./services";

/** Preguntas frecuentes generales. Solo respuestas que la empresa ha confirmado o que dicta la ley. */
export const faqs: Faq[] = [
  {
    q: "¿El precio de la calculadora es el definitivo?",
    a: "Es un precio orientativo hecho con nuestras tarifas base. El definitivo te lo damos por escrito después de ver la obra, porque el estado de las paredes, el acceso o la ubicación pueden cambiarlo.",
  },
  {
    q: "¿Los precios llevan IVA?",
    a: "No, los precios base son sin IVA. En obras en la vivienda de un particular puede aplicarse el 10 % si se cumplen los requisitos legales; en el resto, el 21 %. Te lo indicamos en el presupuesto.",
  },
  {
    q: "¿Hacéis baños y fontanería?",
    a: "Sí. Además de pintura y acabados hacemos reformas: baños, fontanería y albañilería. Como cada caso es distinto, no damos precio sin verlo: reservas la visita y te mandamos el presupuesto por partidas.",
  },
  {
    q: "¿Cómo reservo la visita?",
    a: "Al terminar la calculadora, o desde la página de contacto, eliges día y hora. Si ya vamos a estar trabajando cerca de tu casa, te marcamos esos días. También puedes llamarnos o escribirnos por WhatsApp.",
  },
  {
    q: "¿Trabajáis fuera de Madrid?",
    a: "Sí. Si la obra está fuera de Madrid, el desplazamiento va indicado en el presupuesto, para que lo veas desde el principio.",
  },
  {
    q: "¿Qué incluye el presupuesto?",
    a: "Cada trabajo por separado, con su descripción, su medida y su precio. Así sabes qué pagas en cada parte y puedes quitar o añadir partidas.",
  },
];

import { GroupedServices, SectionHead } from "@/components/blocks";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Pintura, acabados, baños y reformas en Madrid",
  description:
    "Pintura de interiores, alisado de gotelé, lacados, microcemento, epoxi, pladur y papel pintado con precio publicado. Baños, fontanería, albañilería y reformas con visita gratis.",
  path: "/servicios",
});

export default function ServiciosPage() {
  return (
    <section className="wrap pb-24 pt-36 md:pb-36 md:pt-48">
      <SectionHead title={<>Del primer brochazo <em>a la reforma entera.</em></>}>
        Precios base sin IVA, con nuestras tarifas. El precio final lo cerramos por escrito tras la visita, según el estado de la superficie
        y dónde esté la obra.
      </SectionHead>
      <div className="mt-14 md:mt-20">
        <GroupedServices />
      </div>
    </section>
  );
}

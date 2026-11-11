import { SectionHead, ServiceIndex } from "@/components/blocks";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Servicios de pintura, acabados y reformas en Madrid",
  description:
    "Pintura de interiores, alisado de gotelé, lacados, microcemento, suelos epoxi, papel pintado, pladur, reformas y restauración de muebles en Madrid.",
  path: "/servicios",
});

export default function ServiciosPage() {
  return (
    <section className="wrap pb-24 pt-36 md:pb-36 md:pt-48">
      <SectionHead label="Servicios" title={<>Del acabado <em>a la reforma.</em></>}>
        Precios base sin IVA, según nuestras tarifas. El precio final depende del estado de la superficie y de la ubicación de la obra.
      </SectionHead>
      <div className="mt-14 md:mt-20">
        <ServiceIndex />
      </div>
    </section>
  );
}

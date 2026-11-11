import { Calculator } from "@/components/Calculator";
import { categories, type CategoryId } from "@/content/catalog";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Calculadora de precio de pintura y acabados",
  description:
    "Calcula al momento un precio orientativo para pintar, alisar gotelé, lacar puertas, microcemento, epoxi o pladur en Madrid, con nuestras tarifas base.",
  path: "/calculadora",
});

export default async function CalculadoraPage({ searchParams }: { searchParams: Promise<{ trabajo?: string }> }) {
  const t = (await searchParams).trabajo;
  const initial = categories.find((c) => c.id === t)?.id as CategoryId | undefined;
  return (
    <section className="wrap grid gap-14 pb-24 pt-36 md:grid-cols-12 md:pb-36 md:pt-48">
      <aside className="md:col-span-4">
        <p className="label">Calculadora</p>
        <h1 className="display mt-7 text-[3rem] sm:text-[4rem] lg:text-[4.6rem]">
          Precio orientativo, <em>sin esperas.</em>
        </h1>
        <p className="mt-6 max-w-sm leading-relaxed text-gris">
          Calculamos con nuestras tarifas base. El estado de las superficies y la ubicación pueden cambiar el precio: por eso el presupuesto
          definitivo lo cerramos tras la visita, sin compromiso.
        </p>
      </aside>
      <div className="md:col-span-7 md:col-start-6">
        <Calculator initial={initial} />
      </div>
    </section>
  );
}

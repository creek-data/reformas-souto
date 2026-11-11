import { Calculator } from "@/components/Calculator";
import { categories, type CategoryId } from "@/content/catalog";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Calcula el precio de pintar, alisar gotelé o tu reforma",
  description:
    "Precio orientativo al momento para pintar, alisar gotelé, lacar puertas, microcemento, epoxi o pladur en Madrid. Baños, fontanería y reformas: reserva la visita gratis.",
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
          Saber cuánto cuesta <em>no debería costar.</em>
        </h1>
        <p className="mt-6 max-w-sm leading-relaxed text-gris">
          Pon las medidas y te damos el precio con nuestras tarifas reales, las mismas con las que presupuestamos. Para baños, fontanería y
          reformas, reservas la visita en el momento.
        </p>
        <ul className="mt-10 hidden space-y-3 border-t border-piedra pt-6 text-sm text-gris md:block">
          <li>· Un par de minutos</li>
          <li>· Sin llamadas que no hayas pedido</li>
          <li>· Visita gratis y sin compromiso</li>
        </ul>
      </aside>
      <div className="min-w-0 md:col-span-7 md:col-start-6">
        <Calculator initial={initial} />
      </div>
    </section>
  );
}

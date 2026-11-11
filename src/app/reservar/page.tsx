import type { Metadata } from "next";
import { Booking } from "@/components/Booking";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Reserva tu visita",
  robots: { index: false, follow: false },
};

/** Enlace personal que llega por email junto con el precio orientativo. */
export default async function ReservarPage({ searchParams }: { searchParams: Promise<{ l?: string; t?: string }> }) {
  const { l, t } = await searchParams;
  return (
    <section className="wrap grid gap-14 pb-24 pt-36 md:grid-cols-12 md:pb-36 md:pt-48">
      <div className="md:col-span-4">
        <p className="label">Visita sin compromiso</p>
        <h1 className="display mt-7 text-[3rem] sm:text-[4rem] lg:text-[4.6rem]">
          Elige día <em>y te vemos allí.</em>
        </h1>
        <p className="mt-6 max-w-sm leading-relaxed text-gris">
          Medimos, revisamos el estado de las superficies y te mandamos el presupuesto cerrado por escrito. ¿Dudas? {site.phoneDisplay}.
        </p>
      </div>
      <div className="min-w-0 md:col-span-7 md:col-start-6">
        {l && t ? (
          <Booking l={l} t={t} intro={false} />
        ) : (
          <p className="leading-relaxed text-gris">
            Falta el enlace personal. Ábrelo desde el email que te enviamos o llámanos al{" "}
            <a href={`tel:${site.phone}`} className="underline underline-offset-4">{site.phoneDisplay}</a>.
          </p>
        )}
      </div>
    </section>
  );
}

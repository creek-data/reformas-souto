import Link from "next/link";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Arrow, ClientsStrip, SectionHead, ServiceIndex, Steps, Testimonials } from "@/components/blocks";
import { FinishSampler } from "@/components/FinishSampler";
import { site, whatsappUrl } from "@/content/site";
import { estimate, formatEuros } from "@/lib/pricing/engine";

const layers = [
  { n: "05", t: "Dos capas de pintura plástica lavable", c: "#f6f3ed" },
  { n: "04", t: "Corrección de fallos", c: "#efebe3" },
  { n: "03", t: "Una mano de imprimación", c: "#e7e1d6" },
  { n: "02", t: "Lijado", c: "#ddd6c8" },
  { n: "01", t: "Tres capas de emplaste", c: "#d2c9b8" },
];

// Ejemplo calculado con tarifas reales: 60 m² de alisado + 2 puertas.
const example = estimate([
  { code: "alisado-gotele", qty: 60 },
  { code: "esmaltado-puertas", qty: 2 },
]);

export default function Home() {
  return (
    <>
      {/* ——— Hero ——— */}
      <section className="wrap grid gap-14 pb-20 pt-32 md:grid-cols-12 md:gap-10 md:pb-28 md:pt-40 lg:min-h-[100svh] lg:items-center">
        <div className="md:col-span-7 lg:pr-8">
          <p className="label">Pintura · Acabados · Reformas — Madrid</p>
          <h1 className="display line-in mt-7 text-[3.6rem] sm:text-[5rem] lg:text-[7.4rem]">
            <span><span style={{ "--i": 0 } as React.CSSProperties}>El acabado</span></span>
            <span><span style={{ "--i": 1 } as React.CSSProperties}>lo es <em>todo.</em></span></span>
          </h1>
          <p className="mt-8 max-w-[34rem] text-[1.125rem] leading-relaxed text-gris md:text-[1.2rem]" data-reveal style={{ "--delay": "450ms" } as React.CSSProperties}>
            Pintura, alisado de gotelé, lacados, microcemento, suelos epoxi y reformas. En Madrid y fuera de Madrid, con equipo propio y
            presupuesto por partidas.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" data-reveal style={{ "--delay": "600ms" } as React.CSSProperties}>
            <Link href="/calculadora" className="btn-solid">
              Calcular mi precio <Arrow />
            </Link>
            <Link href="/contacto" className="link-arrow">
              Pedir presupuesto sin compromiso
            </Link>
          </div>
        </div>
        <div className="md:col-span-5" data-reveal style={{ "--delay": "300ms" } as React.CSSProperties}>
          <FinishSampler />
        </div>
      </section>

      {/* ——— Capa a capa ——— */}
      <section className="border-y border-piedra bg-lino/60 py-24 md:py-36">
        <div className="wrap grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label" data-reveal>Nuestro método</p>
            <h2 className="display mt-5 text-[2.6rem] md:text-[4.2rem]" data-reveal>
              Lo que no se ve <em>es lo que dura.</em>
            </h2>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-gris" data-reveal>
              Un buen acabado empieza debajo. Así alisamos una pared de gotelé: cinco pasos antes de que la veas terminada.
            </p>
            <Link href="/servicios/alisado-de-gotele" className="link-arrow mt-8" data-reveal>
              Alisado de gotelé
            </Link>
          </div>
          <ol className="flex flex-col md:col-span-6 md:col-start-7" aria-label="Capas del alisado de gotelé, de la última a la primera">
            {layers.map((l, i) => (
              <li
                key={l.n}
                data-roller
                style={{ background: l.c, transitionDelay: `${(layers.length - i) * 120}ms` } as React.CSSProperties}
                className="flex min-h-[4.75rem] items-center justify-between gap-6 border-b border-cal/80 px-5 md:min-h-[5.5rem] md:px-7"
              >
                <span className="text-[1.02rem] md:text-lg">{l.t}</span>
                <span className="label tabular-nums !text-grafito">{l.n}</span>
              </li>
            ))}
            <li className="mt-3 flex items-center justify-between px-1 text-sm text-gris">
              <span>Soporte con gotelé</span>
              <span className="label">00</span>
            </li>
          </ol>
        </div>
      </section>

      {/* ——— Servicios ——— */}
      <section className="wrap py-24 md:py-36" aria-labelledby="servicios">
        <SectionHead label="Servicios" title={<span id="servicios">Qué hacemos</span>}>
          Especialistas en pintura y acabados, y reformas generales: baños, fontanería y albañilería. Precios base sin IVA.
        </SectionHead>
        <div className="mt-14 md:mt-20">
          <ServiceIndex />
        </div>
      </section>

      {/* ——— Calculadora ——— */}
      <section className="bg-grafito py-24 text-cal md:py-36">
        <div className="wrap grid gap-14 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <p className="label !text-cal/60" data-reveal>Calculadora</p>
            <h2 className="display mt-5 text-[2.6rem] md:text-[4.2rem]" data-reveal>
              Tu precio orientativo, <em>en un minuto.</em>
            </h2>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-cal/70" data-reveal>
              Elige el trabajo y las medidas. Calculamos con nuestras tarifas base y cerramos el presupuesto cuando vemos la superficie.
            </p>
            <Link href="/calculadora" className="btn-solid mt-10 !bg-cal !text-grafito hover:!bg-white" data-reveal>
              Empezar <Arrow />
            </Link>
          </div>
          <div className="md:col-span-5 md:col-start-8" data-reveal>
            <div className="border border-cal/15 p-7 md:p-9">
              <p className="label !text-cal/60">Ejemplo con nuestras tarifas</p>
              <ul className="mt-6 divide-y divide-cal/10">
                {example.lines.map((l) => (
                  <li key={l.code} className="flex justify-between gap-6 py-4 text-[0.98rem]">
                    <span>
                      {l.name}
                      <span className="block text-sm text-cal/55">
                        {l.qty} {l.unit === "m2" ? "m²" : "ud"} × {formatEuros(l.unitPriceCents)}
                      </span>
                    </span>
                    <span className="tabular-nums">{formatEuros(l.totalCents)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-baseline justify-between border-t border-cal/25 pt-6">
                <span className="text-sm text-cal/60">Precio base</span>
                <span className="display text-5xl tabular-nums">{formatEuros(example.baseCents)}</span>
              </p>
              <p className="mt-2 text-right text-sm text-cal/55">+ IVA · sujeto a revisión tras la visita</p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Cómo trabajamos ——— */}
      <section className="wrap py-24 md:py-36">
        <SectionHead label="Cómo trabajamos" title={<>Claro desde <em>el primer día.</em></>}>
          Antes de empezar sabes qué vamos a hacer y cuánto cuesta. Visita y presupuesto sin compromiso.
        </SectionHead>
        <div className="mt-14 md:mt-20">
          <Steps />
        </div>
      </section>

      {/* Preparados, ocultos hasta tener contenido real y permisos */}
      <BeforeAfter />
      <ClientsStrip />
      <Testimonials />

      {/* ——— Zona ——— */}
      <section className="border-t border-piedra">
        <div className="wrap grid gap-10 py-24 md:grid-cols-12 md:py-32">
          <p className="label md:col-span-3" data-reveal>Dónde trabajamos</p>
          <div className="md:col-span-8 md:col-start-5">
            <p className="display text-[2.6rem] md:text-[4.2rem]" data-reveal>
              Madrid <em>y fuera de Madrid.</em>
            </p>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-gris" data-reveal>
              {site.areaLong}
            </p>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4" data-reveal>
              <a href={`tel:${site.phone}`} className="link-arrow tabular-nums">Llamar al {site.phoneDisplay}</a>
              <a href={whatsappUrl()} rel="noopener" className="link-arrow">Escribir por WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

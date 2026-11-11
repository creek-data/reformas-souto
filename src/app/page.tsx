import Link from "next/link";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Arrow, ClientsStrip, FaqList, faqJsonLd, GroupedServices, SectionHead, Steps, Testimonials } from "@/components/blocks";
import { FinishSampler } from "@/components/FinishSampler";
import { faqs } from "@/content/faq";
import { site, whatsappUrl } from "@/content/site";
import { estimate, formatEuros } from "@/lib/pricing/engine";
import { businessJsonLd, jsonLdScript } from "@/lib/seo";

const layers = [
  { n: "05", t: "Dos manos de pintura plástica lavable", c: "#f6f3ed" },
  { n: "04", t: "Corrección de fallos", c: "#efebe3" },
  { n: "03", t: "Una mano de imprimación", c: "#e7e1d6" },
  { n: "02", t: "Lijado", c: "#ddd6c8" },
  { n: "01", t: "Tres capas de emplaste", c: "#d2c9b8" },
];

const promises = [
  { t: "Tu precio, al momento", d: "Con nuestras tarifas reales" },
  { t: "Visita gratis", d: "Eliges tú el día y la hora" },
  { t: "Presupuesto por partidas", d: "Por escrito, sin letra pequeña" },
  { t: "Equipo propio", d: "Y colaboradores de confianza si la obra lo pide" },
];

// Ejemplo calculado con tarifas reales: 60 m² de alisado + 2 puertas.
const example = estimate([
  { code: "alisado-gotele", qty: 60 },
  { code: "esmaltado-puertas", qty: 2 },
]);

const L = ({ i, children }: { i: number; children: React.ReactNode }) => (
  <span>
    <span style={{ "--i": i } as React.CSSProperties}>{children}</span>{" "}
  </span>
);

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript([businessJsonLd(), faqJsonLd(faqs)])} />

      {/* ——— Portada ——— */}
      <section className="wrap grid gap-12 pb-16 pt-28 md:grid-cols-12 md:gap-10 md:pb-24 md:pt-40 lg:min-h-[92svh] lg:items-center">
        <div className="md:col-span-7 lg:pr-8">
          <p className="label">Pintura · Baños · Reformas — Madrid</p>
          <h1 className="display line-in mt-6 text-[3.3rem] sm:text-[4.6rem] lg:text-[6.6rem]">
            <L i={0}>Pintura y reformas</L>
            <L i={1}>en Madrid,</L>
            <L i={2}><em>sin sorpresas.</em></L>
          </h1>
          <p className="mt-7 max-w-[35rem] text-[1.125rem] leading-relaxed text-gris md:text-[1.2rem]">
            Pintamos, alisamos gotelé, lacamos puertas y reformamos baños. Calcula tu precio aquí mismo, elige día para la visita y te
            damos el presupuesto cerrado por escrito.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/calculadora" className="btn-solid">
              Calcular mi precio <Arrow />
            </Link>
            <Link href="/calculadora?trabajo=banos" className="link-arrow">
              Reformar un baño
            </Link>
          </div>
        </div>
        <div className="md:col-span-5" data-reveal style={{ "--delay": "200ms" } as React.CSSProperties}>
          <FinishSampler />
        </div>
      </section>

      {/* ——— Lo que prometemos ——— */}
      <section className="border-y border-piedra" aria-label="Cómo trabajamos, en corto">
        <ul className="wrap grid grid-cols-2 lg:grid-cols-4">
          {promises.map((p, i) => (
            <li
              key={p.t}
              className={`border-piedra py-6 md:py-8 ${i % 2 === 1 ? "border-l pl-5 md:pl-8" : "pr-5"} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-8" : ""}`}
            >
              <p className="text-[1.02rem] font-medium">{p.t}</p>
              <p className="mt-1 text-sm text-gris">{p.d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Servicios ——— */}
      <section className="wrap py-24 md:py-32" aria-labelledby="servicios">
        <SectionHead label="Servicios" title={<span id="servicios">Del primer brochazo <em>a la reforma entera.</em></span>}>
          Pintura y acabados con precio publicado. Baños, fontanería y albañilería con visita y presupuesto por partidas. Todo sin IVA.
        </SectionHead>
        <div className="mt-14 md:mt-20">
          <GroupedServices />
        </div>
      </section>

      {/* ——— Capa a capa ——— */}
      <section className="border-y border-piedra bg-lino/60 py-24 md:py-32">
        <div className="wrap grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label" data-reveal>Cómo lo hacemos</p>
            <h2 className="display mt-5 text-[2.6rem] md:text-[4.2rem]" data-reveal>
              Lo que no se ve <em>es lo que dura.</em>
            </h2>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-gris" data-reveal>
              Una pared bonita el primer día la deja cualquiera. Que siga igual dentro de cinco años depende de lo que hay debajo. Así
              alisamos el gotelé:
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
                className="flex min-h-[4.5rem] items-center justify-between gap-6 border-b border-cal/80 px-5 md:min-h-[5.25rem] md:px-7"
              >
                <span className="text-[1.02rem] md:text-lg">{l.t}</span>
                <span className="label tabular-nums !text-grafito">{l.n}</span>
              </li>
            ))}
            <li className="mt-3 flex items-center justify-between px-1 text-sm text-gris">
              <span>Tu pared con gotelé</span>
              <span className="label">00</span>
            </li>
          </ol>
        </div>
      </section>

      {/* ——— Calculadora ——— */}
      <section className="bg-grafito py-24 text-cal md:py-32">
        <div className="wrap grid gap-14 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <p className="label !text-cal/60" data-reveal>Calculadora</p>
            <h2 className="display mt-5 text-[2.6rem] md:text-[4.2rem]" data-reveal>
              Saber cuánto cuesta <em>no debería costar.</em>
            </h2>
            <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-cal/70" data-reveal>
              Elige el trabajo, pon los metros y ve el precio con las mismas tarifas con las que presupuestamos. Sin llamadas que no hayas
              pedido.
            </p>
            <Link href="/calculadora" className="btn-solid mt-10 !bg-cal !text-grafito hover:!bg-white" data-reveal>
              Calcular mi precio <Arrow />
            </Link>
          </div>
          <div className="md:col-span-5 md:col-start-8" data-reveal>
            <div className="border border-cal/15 p-7 md:p-9">
              <p className="label !text-cal/60">Un ejemplo real</p>
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
              <p className="mt-2 text-right text-sm text-cal/55">+ IVA · se confirma en la visita</p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Cómo trabajamos ——— */}
      <section className="wrap py-24 md:py-32">
        <SectionHead label="Paso a paso" title={<>Sabes lo que pagas <em>antes de empezar.</em></>}>
          Del primer clic a la obra terminada, sin llamadas eternas ni presupuestos de una línea.
        </SectionHead>
        <div className="mt-14 md:mt-20">
          <Steps />
        </div>
      </section>

      {/* Preparados, ocultos hasta tener contenido real y permisos */}
      <BeforeAfter />
      <ClientsStrip />
      <Testimonials />

      {/* ——— Preguntas ——— */}
      <section className="border-t border-piedra">
        <div className="wrap grid gap-12 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-4">
            <p className="label">Preguntas frecuentes</p>
            <h2 className="display mt-5 text-[2.6rem] md:text-[3.4rem]">Lo que todo el mundo <em>nos pregunta.</em></h2>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <FaqList items={faqs} />
          </div>
        </div>
      </section>

      {/* ——— Zona ——— */}
      <section className="border-t border-piedra bg-lino/60">
        <div className="wrap grid gap-10 py-24 md:grid-cols-12 md:py-32">
          <p className="label md:col-span-3">Dónde trabajamos</p>
          <div className="md:col-span-8 md:col-start-5">
            <p className="display text-[2.6rem] md:text-[4.2rem]">
              Madrid y alrededores. <em>Y más lejos, si hace falta.</em>
            </p>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-gris">{site.areaLong}</p>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              <a href={`tel:${site.phone}`} className="link-arrow tabular-nums">Llamar al {site.phoneDisplay}</a>
              <a href={whatsappUrl()} rel="noopener" className="link-arrow">Escribir por WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

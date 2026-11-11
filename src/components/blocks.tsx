import Link from "next/link";
import { findItem, groupLabel, unitLabel, type CategoryGroup } from "@/content/catalog";
import { clients, testimonials } from "@/content/pending";
import { services, servicesIn, type Faq, type Service } from "@/content/services";
import { features } from "@/content/site";
import { formatEuros } from "@/lib/pricing/engine";

export function fromPrice(s: Service): string | null {
  const prices = s.items.map(findItem).filter((i) => i != null);
  if (!prices.length) return null;
  const min = prices.reduce((a, b) => (b.basePriceCents < a.basePriceCents ? b : a));
  return `desde ${formatEuros(min.basePriceCents)}/${unitLabel[min.unit]}`;
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function SectionHead({ label, title, children }: { label: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <p className="label" data-reveal>{label}</p>
        <h2 className="display mt-5 text-[2.6rem] md:text-[4.2rem]" data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}>
          {title}
        </h2>
      </div>
      {children && (
        <div className="max-w-md text-[1.05rem] leading-relaxed text-gris md:col-span-4 md:col-start-9" data-reveal style={{ "--delay": "160ms" } as React.CSSProperties}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Índice editorial de servicios: filas numeradas en lugar de tarjetas. */
export function ServiceIndex({ list = services, start = 0 }: { list?: Service[]; start?: number }) {
  return (
    <ul className="border-t border-piedra">
      {list.map((s, i) => {
        const price = fromPrice(s);
        return (
          <li key={s.slug} className="border-b border-piedra" data-reveal style={{ "--delay": `${i * 40}ms` } as React.CSSProperties}>
            <Link
              href={`/servicios/${s.slug}`}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 gap-y-1 py-6 md:grid-cols-[4rem_minmax(0,5fr)_minmax(0,5fr)_minmax(0,2fr)_2rem] md:py-8"
            >
              <span className="label tabular-nums">{String(start + i + 1).padStart(2, "0")}</span>
              <span className="display text-[1.9rem] transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-2 md:text-[2.6rem]">
                {s.name}
              </span>
              <Arrow className="self-center text-gris transition-transform duration-500 group-hover:translate-x-1 group-hover:text-grafito md:order-last" />
              <span className="col-start-2 text-[0.95rem] leading-relaxed text-gris md:col-start-auto md:pr-6">{s.lead}</span>
              <span className="col-start-2 text-sm text-grafito md:col-start-auto md:text-right">
                {price ?? "Precio tras la visita"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const groupIntro: Record<CategoryGroup, string> = {
  acabados: "Con precio publicado: calcula el tuyo en un minuto.",
  reformas: "Cada obra es distinta: la vemos y te damos precio cerrado por partidas.",
};

/** Servicios en dos bloques: lo que tiene precio al momento y lo que se presupuesta con visita. */
export function GroupedServices() {
  const groups: CategoryGroup[] = ["acabados", "reformas"];
  let n = 0;
  return (
    <div className="space-y-16 md:space-y-24">
      {groups.map((g) => {
        const list = servicesIn(g);
        const start = n;
        n += list.length;
        return (
          <section key={g} id={g} className="scroll-mt-28" aria-labelledby={`grupo-${g}`}>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h3 id={`grupo-${g}`} className="display text-[2rem] md:text-[2.6rem]">{groupLabel[g]}</h3>
              <p className="text-sm text-gris">{groupIntro[g]}</p>
            </div>
            <ServiceIndex list={list} start={start} />
          </section>
        );
      })}
    </div>
  );
}

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="border-t border-piedra">
      {items.map((f) => (
        <details key={f.q} className="group border-b border-piedra">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.08rem] font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="relative h-4 w-4 shrink-0">
              <span className="absolute left-0 top-1/2 h-px w-4 bg-grafito" />
              <span className="absolute left-1/2 top-0 h-4 w-px bg-grafito transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="max-w-2xl pb-6 leading-relaxed text-gris">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export const faqJsonLd = (items: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

const steps = [
  { t: "Calculas o nos cuentas", d: "Pon las medidas y ve tu precio al momento. Si es un baño o una reforma, cuéntanoslo en dos líneas." },
  { t: "Eliges día de visita", d: "Reservas tú, en los huecos libres. Si ese día ya estamos cerca de tu casa, te lo marcamos." },
  { t: "Presupuesto por escrito", d: "Cada trabajo con su medida y su precio. Sabes qué pagas en cada parte y puedes quitar o añadir." },
  { t: "Manos a la obra", d: "Equipo propio y, cuando la obra lo pide, colaboradores de confianza. Protegemos suelos y muebles antes de empezar." },
];

export function Steps() {
  return (
    <ol className="grid gap-px overflow-hidden border border-piedra bg-piedra sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.t} className="flex min-h-64 flex-col bg-cal p-7 md:p-8" data-reveal style={{ "--delay": `${i * 90}ms` } as React.CSSProperties}>
          <span className="display text-6xl text-bronce">{String(i + 1).padStart(2, "0")}</span>
          <span className="mt-auto pt-10 text-lg font-medium">{s.t}</span>
          <span className="mt-2 text-[0.95rem] leading-relaxed text-gris">{s.d}</span>
        </li>
      ))}
    </ol>
  );
}

/** Se publica solo con permiso de cada empresa (features.clients). */
export function ClientsStrip() {
  if (!features.clients || clients.length === 0) return null;
  return (
    <section className="wrap py-20" aria-labelledby="clientes">
      <p id="clientes" className="label">Han confiado en nosotros</p>
      <ul className="mt-8 grid grid-cols-2 gap-px border border-piedra bg-piedra md:grid-cols-4">
        {clients.map((c) => (
          <li key={c.name} className="flex min-h-28 items-center justify-center bg-cal p-6 text-center">
            {c.logo ? <img src={c.logo} alt={c.name} className="max-h-10 w-auto opacity-80 grayscale" /> : <span className="display text-2xl">{c.name}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Se publica solo con reseñas reales y verificables (features.testimonials). */
export function Testimonials() {
  if (!features.testimonials || testimonials.length === 0) return null;
  return (
    <section className="wrap py-24" aria-labelledby="opiniones">
      <p id="opiniones" className="label">Opiniones</p>
      <div className="mt-10 grid gap-12 md:grid-cols-2">
        {testimonials.map((t) => (
          <figure key={t.author} className="m-0">
            <blockquote className="display text-3xl md:text-4xl">«{t.quote}»</blockquote>
            <figcaption className="mt-5 text-sm text-gris">
              {t.author} · {t.source}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

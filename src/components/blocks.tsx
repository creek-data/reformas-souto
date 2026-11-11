import Link from "next/link";
import { findItem, unitLabel } from "@/content/catalog";
import { clients, testimonials } from "@/content/pending";
import { services, type Service } from "@/content/services";
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
export function ServiceIndex({ list = services }: { list?: Service[] }) {
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
              <span className="label tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="display text-[1.9rem] transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-2 md:text-[2.6rem]">
                {s.name}
              </span>
              <Arrow className="self-center text-gris transition-transform duration-500 group-hover:translate-x-1 group-hover:text-grafito md:order-last" />
              <span className="col-start-2 text-[0.95rem] leading-relaxed text-gris md:col-start-auto md:pr-6">{s.lead}</span>
              <span className="col-start-2 text-sm text-grafito md:col-start-auto md:text-right">
                {price ?? "Presupuesto con visita"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const steps = [
  { t: "Nos cuentas qué necesitas", d: "Por la calculadora, el formulario, WhatsApp o teléfono." },
  { t: "Visitamos y medimos", d: "Vemos el estado de las superficies antes de dar un precio cerrado." },
  { t: "Presupuesto por partidas", d: "Cada trabajo con su descripción y su precio, por escrito." },
  { t: "Ejecución", d: "Con equipo propio y colaboradores especializados." },
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

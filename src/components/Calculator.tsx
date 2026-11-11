"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { catalog, categories, unitLabel, type CatalogItem, type CategoryId } from "@/content/catalog";
import { estimate, formatEuros, roomAreas, type Location, type SurfaceCondition } from "@/lib/pricing/engine";
import { Arrow } from "./blocks";
import { LeadFields } from "./LeadFields";

type Inmueble = "vivienda" | "local" | "comunidad";
const STEPS = ["Trabajo", "Medidas", "Detalles", "Estimación", "Contacto"] as const;

function Choice<T extends string>({
  name, value, options, onChange,
}: { name: string; value: T | undefined; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="border-t border-piedra pt-6">
      <legend className="label float-left mb-4 w-full">{name}</legend>
      <div className="clear-both flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.v}
            className={`flex min-h-12 cursor-pointer items-center rounded-full border px-5 text-[0.95rem] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bronce ${
              value === o.v ? "border-grafito bg-grafito text-cal" : "border-piedra hover:border-grafito"
            }`}
          >
            <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} className="sr-only" />
            {o.l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RoomHelper({ item, onUse }: { item: CatalogItem; onUse: (m2: number) => void }) {
  const [d, setD] = useState({ l: "", w: "", h: "2.5" });
  const n = (v: string) => Number(v.replace(",", "."));
  const areas = roomAreas(n(d.l), n(d.w), item.surface === "suelo" ? 1 : n(d.h));
  const input = (k: "l" | "w" | "h", label: string) => (
    <label className="flex flex-col gap-1 text-sm text-gris">
      {label}
      <input
        inputMode="decimal"
        value={d[k]}
        onChange={(e) => setD({ ...d, [k]: e.target.value })}
        className="field !min-h-11 !py-2 tabular-nums"
        placeholder="0"
        aria-label={`${label} en metros`}
      />
    </label>
  );
  return (
    <div className="mt-4 grid gap-4 bg-lino/70 p-5">
      <div className="grid grid-cols-3 gap-4">
        {input("l", "Largo (m)")}
        {input("w", "Ancho (m)")}
        {item.surface === "pared" ? input("h", "Alto (m)") : <span />}
      </div>
      {areas && (
        <div className="flex flex-wrap gap-2">
          {item.surface === "suelo" ? (
            <button type="button" className="btn-ghost !min-h-11 !px-4 text-sm" onClick={() => onUse(areas.ceiling)}>
              Usar {areas.ceiling} m² de suelo
            </button>
          ) : (
            <>
              <button type="button" className="btn-ghost !min-h-11 !px-4 text-sm" onClick={() => onUse(areas.walls)}>
                Paredes: {areas.walls} m²
              </button>
              <button type="button" className="btn-ghost !min-h-11 !px-4 text-sm" onClick={() => onUse(Math.round((areas.walls + areas.ceiling) * 100) / 100)}>
                Paredes y techo: {Math.round((areas.walls + areas.ceiling) * 100) / 100} m²
              </button>
            </>
          )}
        </div>
      )}
      <p className="text-xs text-gris">Medida aproximada: no descuenta puertas ni ventanas.</p>
    </div>
  );
}

export function Calculator({ initial }: { initial?: CategoryId }) {
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<CategoryId[]>(initial ? [initial] : []);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [helper, setHelper] = useState<string | null>(null);
  const [condition, setCondition] = useState<SurfaceCondition>();
  const [location, setLocation] = useState<Location>();
  const [inmueble, setInmueble] = useState<Inmueble>();
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
    heading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const priced = cats.filter((c) => categories.find((x) => x.id === c)?.priced);
  const visitOnly = cats.filter((c) => !categories.find((x) => x.id === c)?.priced);
  const lines = useMemo(
    () =>
      catalog
        .filter((i) => priced.includes(i.category))
        .map((i) => ({ code: i.code, qty: Number((qty[i.code] ?? "").replace(",", ".")) }))
        .filter((l) => Number.isFinite(l.qty) && l.qty > 0),
    [priced, qty],
  );
  const est = useMemo(() => {
    try {
      return lines.length ? estimate(lines, { condition, location }) : null;
    } catch {
      return null;
    }
  }, [lines, condition, location]);

  const toggle = (c: CategoryId) => setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const next = () => {
    if (step === 0 && priced.length === 0) return setStep(4); // solo trabajos con visita
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => (s === 4 && priced.length === 0 ? 0 : Math.max(0, s - 1)));
  const canNext = [cats.length > 0, est != null, condition != null && location != null && inmueble != null, true, false][step];

  const titles = [
    "¿Qué quieres hacer?",
    "Medidas",
    "Unos detalles",
    "Tu precio orientativo",
    priced.length ? "Pide tu presupuesto" : "Pide tu visita",
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <p className="label tabular-nums" aria-live="polite">
          Paso {step + 1} de {STEPS.length} · {STEPS[step]}
        </p>
        {step > 0 && (
          <button type="button" onClick={back} className="label min-h-11 !text-grafito underline underline-offset-4">
            Atrás
          </button>
        )}
      </div>
      <div className="mt-4 h-px bg-piedra" aria-hidden>
        <div className="h-px bg-grafito transition-[width] duration-700 ease-[var(--ease-out-soft)]" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <h2 ref={heading} tabIndex={-1} className="display mt-10 scroll-mt-28 text-[2.4rem] outline-none md:text-[3.4rem]">
        {titles[step]}
      </h2>

      {step === 0 && (
        <div className="mt-8 grid gap-px border border-piedra bg-piedra sm:grid-cols-2">
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(c.id)}
                className={`flex min-h-32 flex-col items-start justify-between p-6 text-left transition-colors ${on ? "bg-grafito text-cal" : "bg-cal hover:bg-lino"}`}
              >
                <span className="flex w-full items-start justify-between gap-4">
                  <span className="display text-[1.9rem]">{c.name}</span>
                  <span aria-hidden className={`mt-2 h-4 w-4 shrink-0 rounded-full border ${on ? "border-cal bg-cal" : "border-grafito"}`} />
                </span>
                <span className={`text-sm ${on ? "text-cal/70" : "text-gris"}`}>
                  {c.short}
                  {!c.priced && " · con visita"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="mt-8 space-y-12">
          {priced.map((cid) => (
            <section key={cid}>
              <p className="label">{categories.find((c) => c.id === cid)?.name}</p>
              <ul className="mt-4 border-t border-piedra">
                {catalog.filter((i) => i.category === cid).map((i) => (
                  <li key={i.code} className="border-b border-piedra py-5">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                      <div>
                        <label htmlFor={`q-${i.code}`} className="text-[1.05rem] font-medium">{i.name}</label>
                        <p className="text-sm text-gris">
                          {formatEuros(i.basePriceCents)}/{unitLabel[i.unit]} + IVA
                          {i.surface && (
                            <>
                              {" · "}
                              <button type="button" className="underline underline-offset-4" onClick={() => setHelper(helper === i.code ? null : i.code)} aria-expanded={helper === i.code}>
                                calcular por medidas
                              </button>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id={`q-${i.code}`}
                          inputMode="decimal"
                          value={qty[i.code] ?? ""}
                          onChange={(e) => setQty({ ...qty, [i.code]: e.target.value.replace(/[^\d.,]/g, "") })}
                          placeholder="0"
                          className="field !min-h-12 w-24 text-right text-lg tabular-nums"
                        />
                        <span className="w-6 text-sm text-gris">{unitLabel[i.unit]}</span>
                      </div>
                    </div>
                    {helper === i.code && (
                      <RoomHelper item={i} onUse={(m2) => { setQty({ ...qty, [i.code]: String(m2).replace(".", ",") }); setHelper(null); }} />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!est && <p className="text-sm text-gris">Indica al menos una cantidad para continuar.</p>}
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-8">
          <Choice name="Estado de las superficies" value={condition} onChange={setCondition}
            options={[{ v: "buena", l: "En buen estado" }, { v: "desperfectos", l: "Con grietas o desperfectos" }, { v: "no-se", l: "No lo sé" }]} />
          <Choice name="Ubicación de la obra" value={location} onChange={setLocation}
            options={[{ v: "madrid", l: "Madrid capital" }, { v: "fuera", l: "Fuera de Madrid capital" }]} />
          <Choice name="Tipo de inmueble" value={inmueble} onChange={setInmueble}
            options={[{ v: "vivienda", l: "Vivienda" }, { v: "local", l: "Local u oficina" }, { v: "comunidad", l: "Comunidad de vecinos" }]} />
        </div>
      )}

      {step === 3 && est && (
        <div className="mt-8">
          <ul className="border-t border-piedra">
            {est.lines.map((l) => (
              <li key={l.code} className="flex justify-between gap-6 border-b border-piedra py-5">
                <span>
                  {l.name}
                  <span className="block text-sm text-gris tabular-nums">
                    {String(l.qty).replace(".", ",")} {unitLabel[l.unit]} × {formatEuros(l.unitPriceCents)}
                  </span>
                </span>
                <span className="tabular-nums">{formatEuros(l.totalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <span className="label">{est.rangeCents ? "Rango orientativo" : "Precio base"}</span>
            <span className="display text-[3.6rem] leading-none tabular-nums md:text-[4.6rem]">
              {est.rangeCents ? `${formatEuros(est.rangeCents.low)} – ${formatEuros(est.rangeCents.high)}` : formatEuros(est.baseCents)}
            </span>
          </div>
          <p className="mt-3 text-right text-sm text-gris">+ IVA (10 % o 21 % según el tipo de obra; lo confirmamos en el presupuesto)</p>
          <div className="mt-10 border-l-2 border-bronce pl-5 text-[0.95rem] leading-relaxed text-gris">
            <p>Es una estimación orientativa con nuestras tarifas base, no un presupuesto. El precio definitivo lo confirmamos por escrito tras la visita.</p>
            {est.pendingFactors.length > 0 && <p className="mt-3">Puede variar por: {est.pendingFactors.map((f) => f.charAt(0).toLowerCase() + f.slice(1)).join(" y ")}.</p>}
            {visitOnly.length > 0 && (
              <p className="mt-3">
                {visitOnly.map((v) => categories.find((c) => c.id === v)?.name).join(" y ")}: lo valoramos en la visita.
              </p>
            )}
          </div>
          <button type="button" onClick={next} className="btn-solid mt-10">
            Pedir presupuesto personalizado <Arrow />
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8">
          <p className="mb-10 max-w-lg text-[1.05rem] leading-relaxed text-gris">
            {priced.length
              ? "Te llamamos para concretar una visita. Recibirás el detalle de tu estimación si nos dejas tu email."
              : "Para estos trabajos no damos precio sin verlos. Déjanos tus datos y te llamamos para concretar la visita."}
          </p>
          <LeadFields
            submitLabel={priced.length ? "Enviar y pedir visita" : "Pedir visita"}
            extra={{ tipo: "calculadora", servicios: cats, lineas: est ? lines : undefined, contexto: { condition, location, inmueble } }}
          />
        </div>
      )}

      {step < 3 && (
        <div className="mt-12 flex items-center gap-6">
          <button type="button" onClick={next} disabled={!canNext} className="btn-solid disabled:cursor-not-allowed disabled:opacity-35">
            Continuar <Arrow />
          </button>
          {step === 1 && est && <span className="text-sm text-gris tabular-nums">Base: {formatEuros(est.baseCents)} + IVA</span>}
        </div>
      )}
    </div>
  );
}

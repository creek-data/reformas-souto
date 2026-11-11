"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { catalog, categories, groupLabel, unitLabel, type CatalogItem, type CategoryGroup, type CategoryId } from "@/content/catalog";
import { site, whatsappUrl } from "@/content/site";
import { formatEuros, roomAreas, type Estimate } from "@/lib/pricing/engine";
import { Arrow } from "./blocks";
import { Booking } from "./Booking";
import { ContactForm } from "./ContactForm";
import { Consent, Field, FormAlert, Honeypot, postJson, useAntiSpam, type Errors } from "./forms";

const catById = (id: CategoryId) => categories.find((c) => c.id === id)!;
const parseQty = (v: string | undefined) => Number((v ?? "").replace(",", "."));

function RoomHelper({ item, onUse }: { item: CatalogItem; onUse: (m2: number) => void }) {
  const [d, setD] = useState({ l: "", w: "", h: "2,5" });
  const n = (v: string) => Number(v.replace(",", "."));
  const areas = roomAreas(n(d.l), n(d.w), item.surface === "suelo" ? 1 : n(d.h));
  const both = areas ? Math.round((areas.walls + areas.ceiling) * 100) / 100 : 0;
  const show = (v: number) => String(v).replace(".", ",");
  const input = (k: "l" | "w" | "h", label: string) => (
    <label className="flex flex-col gap-1 text-sm text-gris">
      {label}
      <input inputMode="decimal" value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} className="field !min-h-11 !py-2 tabular-nums" placeholder="0" />
    </label>
  );
  return (
    <div className="mt-4 grid gap-4 bg-lino/70 p-5">
      <p className="text-sm text-gris">Mide la habitación y te sacamos los metros.</p>
      <div className="grid grid-cols-3 gap-4">
        {input("l", "Largo (m)")}
        {input("w", "Ancho (m)")}
        {item.surface === "pared" ? input("h", "Alto (m)") : <span />}
      </div>
      {areas && (
        <div className="flex flex-wrap gap-2">
          {item.surface === "suelo" ? (
            <button type="button" className="btn-ghost !min-h-11 !px-4 text-sm" onClick={() => onUse(areas.ceiling)}>
              Usar {show(areas.ceiling)} m² de suelo
            </button>
          ) : (
            <>
              <button type="button" className="btn-ghost !min-h-11 !px-4 text-sm" onClick={() => onUse(areas.walls)}>
                Solo paredes: {show(areas.walls)} m²
              </button>
              <button type="button" className="btn-ghost !min-h-11 !px-4 text-sm" onClick={() => onUse(both)}>
                Paredes y techo: {show(both)} m²
              </button>
            </>
          )}
        </div>
      )}
      <p className="text-xs text-gris">Medida aproximada: no descuenta puertas ni ventanas. En la visita la ajustamos.</p>
    </div>
  );
}

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-5 text-[0.95rem] transition-colors ${on ? "border-grafito bg-grafito text-cal" : "border-piedra hover:border-grafito"}`}
    >
      {children}
    </button>
  );
}

type Unlocked = { estimate: Estimate; lead: { id: string; token: string } | null; email: string; emailed: boolean };

export function Calculator({ initial }: { initial?: CategoryId }) {
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<CategoryId[]>(initial ? [initial] : []);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [helper, setHelper] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [unlocked, setUnlocked] = useState<Unlocked | null>(null);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>();
  const spam = useAntiSpam();
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const priced = cats.filter((c) => catById(c).priced);
  const visitOnly = cats.filter((c) => !catById(c).priced);
  const pricedFlow = priced.length > 0;
  const steps = pricedFlow ? ["Trabajo", "Medidas", "Tu precio", "Visita"] : ["Trabajo", "Detalles", "Tus datos y visita"];

  const lines = useMemo(
    () =>
      catalog
        .filter((i) => priced.includes(i.category))
        .map((i) => ({ code: i.code, qty: parseQty(qty[i.code]) }))
        .filter((l) => Number.isFinite(l.qty) && l.qty > 0 && l.qty <= 5000),
    [priced, qty],
  );

  const toggle = (c: CategoryId) => {
    setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
    setUnlocked(null);
  };
  const toggleDetail = (d: string) => setDetails((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));
  const go = (s: number) => setStep(Math.max(0, Math.min(s, steps.length - 1)));
  const canNext = [cats.length > 0, pricedFlow ? lines.length > 0 : true][step] ?? true;

  async function unlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    setSending(true);
    setMessage(undefined);
    const { data } = await postJson<{ estimate: Estimate | null; lead: Unlocked["lead"]; emailed?: boolean }>("/api/solicitudes", {
      tipo: "estimacion",
      email,
      nombre: String(f.get("nombre") ?? "") || undefined,
      codigoPostal: String(f.get("codigoPostal") ?? ""),
      lineas: lines,
      servicios: cats,
      detalles: details.length ? details : undefined,
      mensaje: note || undefined,
      ...spam.fields(f),
    });
    setSending(false);
    if (data.ok && data.estimate) {
      setUnlocked({ estimate: data.estimate, lead: data.lead ?? null, email, emailed: Boolean(data.emailed) });
      return;
    }
    setErrors(data.errors ?? {});
    setMessage(data.error ?? (data.errors ? "Revisa los campos marcados." : "No hemos podido calcularlo. Llámanos."));
  }

  const titles = pricedFlow
    ? ["¿Qué quieres hacer?", "Pon las medidas", unlocked ? "Tu precio orientativo" : "Tu precio está listo", "Reserva la visita"]
    : ["¿Qué quieres hacer?", "Cuéntanos un poco", "¿Dónde te visitamos?"];

  const groups: CategoryGroup[] = ["acabados", "reformas"];

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <p className="label tabular-nums" aria-live="polite">
          Paso {step + 1} de {steps.length} · {steps[step]}
        </p>
        {step > 0 && !(step === 3 && unlocked) && (
          <button type="button" onClick={() => go(step - 1)} className="label min-h-11 !text-grafito underline underline-offset-4">
            Atrás
          </button>
        )}
      </div>
      <div className="mt-4 h-px bg-piedra" aria-hidden>
        <div className="h-px bg-grafito transition-[width] duration-700 ease-[var(--ease-out-soft)]" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <h2 ref={heading} tabIndex={-1} className="display mt-10 scroll-mt-28 text-[2.4rem] outline-none md:text-[3.4rem]">
        {titles[step]}
      </h2>

      <div key={step} className="step-in">
      {/* ——— 1. Trabajo ——— */}
      {step === 0 && (
        <div className="mt-8 space-y-10">
          {groups.map((g) => (
            <section key={g}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="label">{groupLabel[g]}</p>
                <p className="text-xs text-gris">{g === "acabados" ? "Precio al momento" : "Precio tras la visita"}</p>
              </div>
              <div className="mt-4 grid gap-px border border-piedra bg-piedra sm:grid-cols-2">
                {categories
                  .filter((c) => c.group === g)
                  .map((c) => {
                    const on = cats.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(c.id)}
                        className={`flex min-h-28 flex-col items-start justify-between gap-3 p-5 text-left transition-colors md:p-6 ${on ? "bg-grafito text-cal" : "bg-cal hover:bg-lino"}`}
                      >
                        <span className="flex w-full items-start justify-between gap-4">
                          <span className="display text-[1.7rem] leading-none md:text-[1.9rem]">{c.name}</span>
                          <span aria-hidden className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-cal bg-cal text-grafito" : "border-grafito"}`}>
                            {on && <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>}
                          </span>
                        </span>
                        <span className={`text-sm ${on ? "text-cal/70" : "text-gris"}`}>{c.short}</span>
                      </button>
                    );
                  })}
              </div>
            </section>
          ))}
          <p className="text-sm text-gris">Puedes marcar varios.</p>
        </div>
      )}

      {/* ——— 2. Medidas (con precio) o detalles (con visita) ——— */}
      {step === 1 && (
        <div className="mt-8 space-y-12">
          {priced.map((cid) => (
            <section key={cid}>
              <p className="label">{catById(cid).name}</p>
              <ul className="mt-4 border-t border-piedra">
                {catalog
                  .filter((i) => i.category === cid)
                  .map((i) => (
                    <li key={i.code} className="border-b border-piedra py-5">
                      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div>
                          <label htmlFor={`q-${i.code}`} className="text-[1.05rem] font-medium">{i.name}</label>
                          <p className="text-sm text-gris">
                            {formatEuros(i.basePriceCents)}/{unitLabel[i.unit]} + IVA
                            {i.surface && (
                              <>
                                {" · "}
                                <button
                                  type="button"
                                  className="underline underline-offset-4"
                                  onClick={() => setHelper(helper === i.code ? null : i.code)}
                                  aria-expanded={helper === i.code}
                                >
                                  no sé los metros
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
                            onChange={(e) => {
                              setQty({ ...qty, [i.code]: e.target.value.replace(/[^\d.,]/g, "") });
                              setUnlocked(null);
                            }}
                            placeholder="0"
                            className="field !min-h-12 w-24 text-right text-lg tabular-nums"
                          />
                          <span className="w-6 text-sm text-gris">{unitLabel[i.unit]}</span>
                        </div>
                      </div>
                      {helper === i.code && (
                        <RoomHelper
                          item={i}
                          onUse={(m2) => {
                            setQty({ ...qty, [i.code]: String(m2).replace(".", ",") });
                            setHelper(null);
                            setUnlocked(null);
                          }}
                        />
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          ))}

          {visitOnly.map((cid) => {
            const c = catById(cid);
            return (
              <section key={cid}>
                <p className="label">{c.name}{pricedFlow ? " · lo vemos en la visita" : ""}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(c.intents ?? []).map((d) => (
                    <Chip key={d} on={details.includes(d)} onClick={() => toggleDetail(d)}>{d}</Chip>
                  ))}
                </div>
              </section>
            );
          })}

          {visitOnly.length > 0 && (
            <div>
              <label htmlFor="c-note" className="label">Cuéntanos lo que quieras (opcional)</label>
              <textarea
                id="c-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1500}
                className="field"
                placeholder="Medidas aproximadas, estado actual, cuándo te gustaría empezar…"
              />
            </div>
          )}

          {pricedFlow && lines.length === 0 && <p className="text-sm text-gris">Pon al menos una medida para seguir.</p>}
        </div>
      )}

      {/* ——— 3a. Precio: se desbloquea con el email ——— */}
      {step === 2 && pricedFlow && !unlocked && (
        <div className="mt-8">
          <ul className="border-t border-piedra">
            {lines.map((l) => {
              const i = catalog.find((x) => x.code === l.code)!;
              return (
                <li key={l.code} className="flex items-center justify-between gap-6 border-b border-piedra py-4">
                  <span>
                    {i.name}
                    <span className="block text-sm text-gris tabular-nums">
                      {String(l.qty).replace(".", ",")} {unitLabel[i.unit]}
                    </span>
                  </span>
                  <span aria-hidden className="h-4 w-20 rounded-full bg-piedra/70" />
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex items-end justify-between gap-4" aria-hidden>
            <span className="label">Precio base</span>
            <span className="h-12 w-44 rounded-full bg-gradient-to-r from-piedra/80 via-lino to-piedra/80 md:h-14 md:w-56" />
          </div>

          <form onSubmit={unlock} noValidate className="relative mt-12 grid gap-x-8 gap-y-7 border border-piedra bg-cal p-6 sm:grid-cols-2 md:p-8">
            <div className="sm:col-span-2">
              <p className="text-[1.15rem] font-medium">¿A qué email te lo mandamos?</p>
              <p className="mt-1 text-sm leading-relaxed text-gris">Lo ves aquí al momento y te llega el desglose por correo, para tenerlo a mano.</p>
            </div>
            <Field name="email" label="Email" type="email" autoComplete="email" error={errors.email} required />
            <Field
              name="codigoPostal"
              label="Código postal de la obra"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              error={errors.codigoPostal}
              hint="Para saber si hay desplazamiento."
              required
            />
            <Field name="nombre" label="Nombre (opcional)" autoComplete="given-name" className="sm:col-span-2" />
            <Honeypot />
            <Consent error={errors.consentimiento} purpose="enviarme este precio y, si lo pido, organizar la visita" />
            {spam.turnstile && <div ref={spam.widgetRef} className="sm:col-span-2" />}
            <FormAlert message={message ?? errors.lineas} />
            <div className="sm:col-span-2">
              <button type="submit" disabled={sending} className="btn-solid disabled:opacity-60">
                {sending ? "Calculando…" : "Ver mi precio"} {!sending && <Arrow />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ——— 3b. Precio desbloqueado ——— */}
      {step === 2 && unlocked && (
        <div className="mt-8">
          <ul className="border-t border-piedra">
            {unlocked.estimate.lines.map((l) => (
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
            <span className="label">Precio base</span>
            <span className="display text-[3.6rem] leading-none tabular-nums md:text-[4.6rem]">{formatEuros(unlocked.estimate.baseCents)}</span>
          </div>
          <p className="mt-3 text-right text-sm text-gris">+ IVA: 10 % en tu vivienda si cumple los requisitos, 21 % en el resto</p>

          <div className="mt-10 bg-lino/70 p-5 text-[0.95rem] leading-relaxed text-gris md:p-6">
            <p>
              Es un precio orientativo con nuestras tarifas. El definitivo te lo damos por escrito cuando veamos la obra
              {unlocked.estimate.pendingFactors.length > 0 &&
                `: pueden cambiarlo ${unlocked.estimate.pendingFactors.map((f) => f.charAt(0).toLowerCase() + f.slice(1)).join(" y ")}`}
              .
            </p>
            {visitOnly.length > 0 && <p className="mt-3">{visitOnly.map((v) => catById(v).name).join(" y ")}: lo presupuestamos en la visita.</p>}
            {unlocked.emailed && <p className="mt-3">Te hemos mandado el desglose a {unlocked.email}.</p>}
          </div>

          <div className="mt-12 bg-grafito p-7 text-cal md:p-9">
            <p className="display text-[2rem] leading-tight md:text-[2.6rem]">
              Siguiente paso: <em>la visita, gratis.</em>
            </p>
            <p className="mt-3 max-w-md text-cal/70">Elige día y hora. Medimos, revisamos las paredes y te damos el precio cerrado.</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              {unlocked.lead ? (
                <button type="button" onClick={() => go(3)} className="btn-solid !bg-cal !text-grafito hover:!bg-white">
                  Elegir día de visita <Arrow />
                </button>
              ) : (
                <a href={`tel:${site.phone}`} className="btn-solid !bg-cal !text-grafito hover:!bg-white tabular-nums">
                  Llamar al {site.phoneDisplay}
                </a>
              )}
              <a href={whatsappUrl("Hola, he calculado mi precio en la web y quería hablarlo.")} rel="noopener" className="text-sm text-cal/75 underline underline-offset-4">
                o escríbenos por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ——— 3. Datos (solo trabajos con visita) ——— */}
      {step === 2 && !pricedFlow && (
        <div className="mt-8">
          <p className="mb-10 max-w-lg text-[1.05rem] leading-relaxed text-gris">
            Cada {visitOnly.includes("banos") ? "baño" : "obra"} es distinto: por eso no damos precio sin verlo. Déjanos tus datos y elige día para la visita.
            Es gratis y sin compromiso.
          </p>
          <ContactForm servicios={cats} detalles={details} mensaje={note || undefined} askMessage={false} submitLabel="Seguir y elegir día" />
        </div>
      )}

      {/* ——— 4. Visita ——— */}
      {step === 3 && unlocked?.lead && (
        <div className="mt-8">
          <Booking l={unlocked.lead.id} t={unlocked.lead.token} />
          <button type="button" onClick={() => go(2)} className="mt-10 text-sm text-gris underline underline-offset-4">
            Volver a mi precio
          </button>
        </div>
      )}

      </div>

      {step < 2 && (
        <div className="mt-12 flex items-center gap-6">
          <button type="button" onClick={() => go(step + 1)} disabled={!canNext} className="btn-solid disabled:cursor-not-allowed disabled:opacity-35">
            {step === 1 && pricedFlow ? "Ver mi precio" : "Continuar"} <Arrow />
          </button>
          {step === 1 && pricedFlow && lines.length > 0 && (
            <span className="text-sm text-gris">{lines.length === 1 ? "1 partida" : `${lines.length} partidas`} lista{lines.length === 1 ? "" : "s"}</span>
          )}
        </div>
      )}
    </div>
  );
}

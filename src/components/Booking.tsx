"use client";

import { useEffect, useMemo, useState } from "react";
import { site, whatsappUrl } from "@/content/site";
import { googleTemplateUrl, icsEvent } from "@/lib/agenda/calendar-links";
import type { DaySlots } from "@/lib/agenda/slots";
import { Arrow } from "./blocks";
import { Field, FormAlert, postJson, type Errors } from "./forms";

interface BookingLead {
  nombre: string | null;
  telefono: string | null;
  visita: string | null;
  direccion: string | null;
}

const TZ = "Europe/Madrid";
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", { timeZone: TZ, ...o });
const dayParts = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  return {
    weekday: fmt({ weekday: "short" }).format(d).replace(".", ""),
    day: fmt({ day: "numeric" }).format(d),
    month: fmt({ month: "short" }).format(d).replace(".", ""),
    long: fmt({ weekday: "long", day: "numeric", month: "long" }).format(d),
  };
};
export const visitText = (iso: string) =>
  `${fmt({ weekday: "long", day: "numeric", month: "long" }).format(new Date(iso))} a las ${fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(iso))}`;

function downloadIcs(start: Date, direccion: string) {
  const end = new Date(start.getTime() + 60 * 60_000);
  const ics = icsEvent({
    uid: `visita-${start.getTime()}@souto`,
    title: `Visita de ${site.name}`,
    start,
    end,
    details: `Teléfono: ${site.phoneDisplay}`,
    location: direccion,
  });
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "visita-souto.ics" });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reserva de la primera visita. Enseña huecos reales (los ocupados en el
 * Google Calendar de la empresa no salen) y marca los días en que ya hay
 * otra visita por la misma zona, para agruparlas.
 */
export function Booking({ l, t, intro = true }: { l: string; t: string; intro?: boolean }) {
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [lead, setLead] = useState<BookingLead | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [mode, setMode] = useState<"visita" | "llamada">("visita");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>();
  const [done, setDone] = useState<{ start: string | null; direccion: string | null } | null>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/agenda?l=${encodeURIComponent(l)}&t=${encodeURIComponent(t)}`, { cache: "no-store" })
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!alive) return;
        if (!ok || !data.ok) return setLoadError(data.error ?? "No hemos podido cargar la agenda.");
        setDays(data.days);
        setLead(data.lead);
        setDay(data.days.find((d: DaySlots) => d.nearby)?.date ?? data.days[0]?.date ?? null);
      })
      .catch(() => alive && setLoadError("No hay conexión. Llámanos y te buscamos un hueco."));
    return () => {
      alive = false;
    };
  }, [l, t]);

  const current = useMemo(() => days?.find((d) => d.date === day) ?? null, [days, day]);
  const hasNearby = days?.some((d) => d.nearby);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (mode === "visita" && !start) return setMessage("Elige un día y una hora.");
    setSending(true);
    setMessage(undefined);
    const { status, data } = await postJson<{ visit: { start: string; direccion: string } | null; days?: DaySlots[] }>("/api/agenda", {
      l,
      t,
      start: mode === "visita" ? start : undefined,
      nombre: String(f.get("nombre") ?? ""),
      telefono: String(f.get("telefono") ?? ""),
      direccion: mode === "visita" ? String(f.get("direccion") ?? "") : undefined,
      nota: String(f.get("nota") ?? "") || undefined,
    });
    setSending(false);
    if (data.ok) {
      setDone({ start: data.visit?.start ?? null, direccion: data.visit?.direccion ?? null });
      return;
    }
    if (status === 409 && data.days) {
      setDays(data.days);
      setStart(null);
    }
    setErrors(data.errors ?? {});
    setMessage(data.error ?? (data.errors ? "Revisa los campos marcados." : "No hemos podido reservar. Llámanos."));
  }

  if (loadError) {
    return (
      <div className="border-l-2 border-bronce pl-5">
        <p className="leading-relaxed text-gris">{loadError}</p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <a href={`tel:${site.phone}`} className="link-arrow tabular-nums">Llamar al {site.phoneDisplay}</a>
          <a href={whatsappUrl("Hola, quería reservar una visita.")} rel="noopener" className="link-arrow">WhatsApp</a>
        </p>
      </div>
    );
  }

  if (done) {
    if (!done.start) {
      return (
        <div role="status">
          <p className="display text-[2.4rem] md:text-[3rem]">Hecho. <em>Te llamamos pronto.</em></p>
          <p className="mt-4 max-w-md leading-relaxed text-gris">
            Te llamaremos en horario laboral para concretar la visita. Si lo prefieres, escríbenos por{" "}
            <a href={whatsappUrl()} rel="noopener" className="underline underline-offset-4">WhatsApp</a>.
          </p>
        </div>
      );
    }
    const s = new Date(done.start);
    return (
      <div role="status">
        <p className="label">Visita reservada</p>
        <p className="display mt-4 text-[2.2rem] leading-tight md:text-[3rem]">
          Te esperamos el <em>{visitText(done.start)}.</em>
        </p>
        <p className="mt-5 max-w-md leading-relaxed text-gris">
          Te llamaremos antes para confirmar. Si te surge algo, avísanos al{" "}
          <a href={`tel:${site.phone}`} className="underline underline-offset-4 tabular-nums">{site.phoneDisplay}</a>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className="btn-ghost !min-h-11 text-sm"
            target="_blank"
            rel="noopener"
            href={googleTemplateUrl({
              title: `Visita de ${site.name}`,
              start: s,
              end: new Date(s.getTime() + 60 * 60_000),
              details: `Teléfono: ${site.phoneDisplay}`,
              location: done.direccion ?? "",
            })}
          >
            Añadir a Google Calendar
          </a>
          <button type="button" className="btn-ghost !min-h-11 text-sm" onClick={() => downloadIcs(s, done.direccion ?? "")}>
            Añadir al calendario del móvil
          </button>
        </div>
      </div>
    );
  }

  if (!days || !lead) {
    return (
      <div aria-busy className="space-y-3">
        <div className="h-5 w-48 animate-pulse bg-lino" />
        <div className="h-20 animate-pulse bg-lino/70" />
      </div>
    );
  }

  if (lead.visita && !changing) {
    return (
      <div>
        <p className="label">Ya tienes visita</p>
        <p className="display mt-4 text-[2.2rem] leading-tight md:text-[2.8rem]">{visitText(lead.visita)}</p>
        <button type="button" onClick={() => setChanging(true)} className="link-arrow mt-6">Cambiar la hora</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {intro && (
        <p className="max-w-lg text-[1.05rem] leading-relaxed text-gris">
          Vamos, vemos la obra, medimos y te damos el precio cerrado por escrito. <strong className="font-medium text-grafito">Es gratis y no te compromete a nada.</strong>
        </p>
      )}

      <div className="mt-8 flex gap-2" role="tablist" aria-label="Cómo prefieres seguir">
        {(["visita", "llamada"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-11 rounded-full border px-5 text-sm font-medium transition-colors ${mode === m ? "border-grafito bg-grafito text-cal" : "border-piedra hover:border-grafito"}`}
          >
            {m === "visita" ? "Elegir día de visita" : "Prefiero que me llaméis"}
          </button>
        ))}
      </div>

      {mode === "visita" && (
        <fieldset className="mt-10 min-w-0">
          <legend className="label">Día</legend>
          {days.length === 0 ? (
            <p className="mt-4 text-gris">
              Ahora mismo no hay huecos libres en la web. Elige «Prefiero que me llaméis» y te buscamos uno.
            </p>
          ) : (
            <>
              <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
                {days.map((d) => {
                  const p = dayParts(d.date);
                  const on = d.date === day;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${p.long}${d.nearby ? ", ya estamos por tu zona" : ""}`}
                      onClick={() => {
                        setDay(d.date);
                        setStart(null);
                      }}
                      className={`relative flex min-w-[4.6rem] snap-start flex-col items-center rounded-2xl border px-3 py-3 transition-colors ${
                        on ? "border-grafito bg-grafito text-cal" : "border-piedra bg-cal hover:border-grafito"
                      }`}
                    >
                      <span className={`text-xs uppercase tracking-[0.14em] ${on ? "text-cal/70" : "text-gris"}`}>{p.weekday}</span>
                      <span className="display mt-1 text-[1.9rem] leading-none">{p.day}</span>
                      <span className={`mt-1 text-xs ${on ? "text-cal/70" : "text-gris"}`}>{p.month}</span>
                      {d.nearby && <span aria-hidden className={`absolute right-2 top-2 h-2 w-2 rounded-full ${on ? "bg-bronce-claro" : "bg-bronce"}`} />}
                    </button>
                  );
                })}
              </div>
              {hasNearby && (
                <p className="mt-2 flex items-center gap-2 text-sm text-gris">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-bronce" /> Ese día ya estamos trabajando cerca de ti.
                </p>
              )}
            </>
          )}

          {current && (
            <div className="mt-8">
              <p className="label" id="horas">Hora · {dayParts(current.date).long}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5" aria-labelledby="horas">
                {current.slots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    aria-pressed={start === s.start}
                    onClick={() => setStart(s.start)}
                    className={`min-h-12 rounded-full border text-[0.95rem] tabular-nums transition-colors ${
                      start === s.start ? "border-grafito bg-grafito text-cal" : "border-piedra hover:border-grafito"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>
      )}

      <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field name="nombre" label="Nombre" autoComplete="name" defaultValue={lead.nombre ?? ""} error={errors.nombre} required />
        <Field name="telefono" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" defaultValue={lead.telefono ?? ""} error={errors.telefono} required />
        {mode === "visita" && (
          <Field
            name="direccion"
            label="Dirección de la obra"
            autoComplete="street-address"
            defaultValue={lead.direccion ?? ""}
            error={errors.direccion}
            placeholder="Calle, número, piso"
            className="sm:col-span-2"
            required
          />
        )}
        <Field
          name="nota"
          label="¿Algo que debamos saber? (opcional)"
          placeholder={mode === "visita" ? "Portero, aparcamiento, mejor por la tarde…" : "Mejor hora para llamarte"}
          className="sm:col-span-2"
          maxLength={1000}
        />
        <FormAlert message={message} />
        <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
          <button type="submit" disabled={sending} className="btn-solid disabled:opacity-60">
            {sending ? "Un momento…" : mode === "visita" ? (start ? `Reservar · ${fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(start))}` : "Reservar visita") : "Que me llamen"}
            {!sending && <Arrow />}
          </button>
          <a href={whatsappUrl()} rel="noopener" className="text-sm text-gris underline underline-offset-4">o escríbenos por WhatsApp</a>
        </div>
      </div>
    </form>
  );
}

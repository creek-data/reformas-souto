"use client";

import { useEffect, useRef, useState } from "react";
import { categories, unitLabel } from "@/content/catalog";
import { site } from "@/content/site";
import { googleTemplateUrl } from "@/lib/agenda/calendar-links";
import { madridParts, madridToUtc } from "@/lib/agenda/slots";
import { ESTADOS, estadoLabel, type Lead } from "@/lib/leads/types";
import { formatEuros } from "@/lib/pricing/engine";
import { zoneDir, zoneLabel } from "@/lib/zones";
import { nearbyDays, waNumber, zoneColor } from "./metrics";

const TZ = "Europe/Madrid";
export const fmtDate = (iso: string, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: TZ, ...o }).format(new Date(iso));

export const serviceNames = (l: Lead) =>
  l.servicios.map((s) => categories.find((c) => c.id === s)?.name ?? s).join(", ") || "Sin especificar";

export function waText(l: Lead) {
  const hola = `Hola${l.nombre ? ` ${l.nombre.split(" ")[0]}` : ""}, te escribimos de ${site.name}.`;
  if (l.estado === "presupuesto_enviado") return `${hola} ¿Pudiste ver el presupuesto? Si tienes cualquier duda, te la resolvemos.`;
  if (l.visita_at) return `${hola} Te confirmamos la visita del ${fmtDate(l.visita_at, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.`;
  return `${hola} Hemos recibido tu solicitud. ¿Cuándo te viene bien que pasemos a verlo?`;
}

export function mailHref(l: Lead) {
  const subject = `Tu presupuesto · ${site.name}`;
  const body = `Hola${l.nombre ? ` ${l.nombre.split(" ")[0]}` : ""}:\n\nVimos que calculaste el precio en nuestra web${
    l.estimacion_base_cents != null ? ` (${formatEuros(l.estimacion_base_cents)} + IVA)` : ""
  }. Si quieres, pasamos a verlo sin compromiso: medimos y te damos el precio cerrado por escrito.\n\n¿Qué día te viene bien? También puedes llamarnos o escribirnos por WhatsApp al ${site.phoneDisplay}.\n\nUn saludo,\n${site.name}`;
  return `mailto:${l.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ZoneTag({ zona }: { zona: string | null }) {
  const d = zoneDir(zona);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {d && <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: zoneColor[d] }} />}
      {zoneLabel(zona)}
    </span>
  );
}

async function patch(id: string, body: unknown): Promise<{ lead?: Lead; error?: string }> {
  const res = await fetch(`/api/panel/solicitudes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { lead: data.lead } : { error: data.error ?? "No se ha podido guardar" };
}

const localInput = (iso: string | null) => {
  if (!iso) return { date: "", time: "" };
  const p = madridParts(new Date(iso));
  return { date: p.date, time: p.time };
};

export function LeadDrawer({
  lead, leads, now, canWrite, gcal, onChange, onDelete, onClose,
}: {
  lead: Lead;
  leads: Lead[];
  now: Date;
  canWrite: boolean;
  gcal: boolean;
  onChange: (l: Lead) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [notas, setNotas] = useState(lead.notas ?? "");
  const [quote, setQuote] = useState(lead.presupuesto_importe_cents != null ? String(lead.presupuesto_importe_cents / 100).replace(".", ",") : "");
  const [visit, setVisit] = useState(localInput(lead.visita_at));
  const [direccion, setDireccion] = useState(lead.visita_direccion ?? "");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotas(lead.notas ?? "");
    setQuote(lead.presupuesto_importe_cents != null ? String(lead.presupuesto_importe_cents / 100).replace(".", ",") : "");
    setVisit(localInput(lead.visita_at));
    setDireccion(lead.visita_direccion ?? "");
    setError(null);
    setSaved(null);
    panel.current?.focus();
  }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(body: unknown, what: string) {
    if (!canWrite) return setError("Modo demostración: los cambios no se guardan.");
    setBusy(true);
    setError(null);
    const r = await patch(lead.id, body);
    setBusy(false);
    if (r.lead) {
      onChange(r.lead);
      setSaved(what);
      setTimeout(() => setSaved(null), 2500);
    } else setError(r.error ?? "Error");
  }

  async function remove() {
    if (!canWrite) return setError("Modo demostración: los cambios no se guardan.");
    if (!window.confirm(`¿Borrar todos los datos de ${lead.nombre ?? lead.email ?? "esta solicitud"}? No se puede deshacer.`)) return;
    const res = await fetch(`/api/panel/solicitudes/${lead.id}`, { method: "DELETE" });
    if (res.ok) onDelete(lead.id);
    else setError("No se ha podido borrar");
  }

  const near = !lead.visita_at ? nearbyDays(lead, leads, now) : [];
  const ctx = lead.contexto as { detalles?: string[]; location?: string };
  const tel = lead.telefono;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Cerrar ficha" className="drawer-scrim absolute inset-0 bg-grafito/30" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-titulo"
        className="drawer-panel relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-cal shadow-[-12px_0_40px_-12px_rgba(28,27,25,0.25)] outline-none"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-piedra bg-cal px-6 py-5">
          <div>
            <p className="text-xs text-gris">
              {lead.tipo === "estimacion" ? "Calculadora" : "Contacto"} · {fmtDate(lead.created_at)}
            </p>
            <h2 id="ficha-titulo" className="display mt-1 text-[2rem] leading-tight">{lead.nombre ?? lead.email ?? "Sin nombre"}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center text-gris hover:text-grafito" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="space-y-8 px-6 py-6">
          <div className="flex flex-wrap gap-2">
            {tel && <a href={`tel:${tel}`} className="btn-solid !min-h-11 !px-5 text-sm">Llamar · {tel}</a>}
            {tel && (
              <a href={`https://wa.me/${waNumber(tel)}?text=${encodeURIComponent(waText(lead))}`} target="_blank" rel="noopener" className="btn-ghost !min-h-11 !px-5 text-sm">
                WhatsApp
              </a>
            )}
            {lead.email && <a href={mailHref(lead)} className="btn-ghost !min-h-11 !px-5 text-sm">Email</a>}
          </div>
          {!tel && <p className="text-sm text-gris">Solo dejó su email al calcular el precio. El botón «Email» abre un mensaje ya escrito para invitarle a la visita.</p>}

          <label className="block">
            <span className="label">Estado</span>
            <select
              value={lead.estado}
              disabled={busy}
              onChange={(e) => save({ estado: e.target.value }, "Estado guardado")}
              className="field mt-1 cursor-pointer"
            >
              {ESTADOS.map((s) => <option key={s} value={s}>{estadoLabel[s]}</option>)}
            </select>
          </label>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[0.95rem]">
            <div><dt className="label">Zona</dt><dd className="mt-1"><ZoneTag zona={lead.zona} /> · {lead.codigo_postal}</dd></div>
            <div><dt className="label">Trabajos</dt><dd className="mt-1">{serviceNames(lead)}</dd></div>
            {lead.email && <div className="col-span-2"><dt className="label">Email</dt><dd className="mt-1 break-all">{lead.email}</dd></div>}
            {ctx.detalles?.length ? <div className="col-span-2"><dt className="label">Detalles</dt><dd className="mt-1">{ctx.detalles.join(" · ")}</dd></div> : null}
            {lead.mensaje && <div className="col-span-2"><dt className="label">Mensaje</dt><dd className="mt-1 whitespace-pre-line">{lead.mensaje}</dd></div>}
          </dl>

          {lead.lineas.length > 0 && (
            <section>
              <p className="label">Lo que calculó en la web</p>
              <ul className="mt-2 border-t border-piedra text-[0.95rem]">
                {lead.lineas.map((l) => (
                  <li key={l.code} className="flex justify-between gap-4 border-b border-piedra py-2.5">
                    <span>{l.name}<span className="block text-xs text-gris tabular-nums">{String(l.qty).replace(".", ",")} {unitLabel[l.unit]} × {formatEuros(l.unitPriceCents)}</span></span>
                    <span className="tabular-nums">{formatEuros(l.totalCents)}</span>
                  </li>
                ))}
              </ul>
              {lead.estimacion_base_cents != null && (
                <p className="mt-2 flex justify-between font-medium">
                  <span>Precio base{ctx.location === "fuera" ? " (fuera de Madrid: falta desplazamiento)" : ""}</span>
                  <span className="tabular-nums">{formatEuros(lead.estimacion_base_cents)} + IVA</span>
                </p>
              )}
            </section>
          )}

          <section className="border-t border-piedra pt-6">
            <p className="label">Visita</p>
            {lead.visita_at && (
              <p className="mt-2 text-lg">
                {fmtDate(lead.visita_at, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                {lead.visita_direccion && <span className="block text-sm text-gris">{lead.visita_direccion}</span>}
              </p>
            )}
            {near.length > 0 && (
              <p className="mt-2 text-sm text-bronce">
                Ya tienes visitas por {zoneLabel(lead.zona)} el {near.map((d) => fmtDate(`${d}T12:00:00Z`, { weekday: "long", day: "numeric" })).join(", ")}.
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm text-gris">Día<input type="date" value={visit.date} onChange={(e) => setVisit({ ...visit, date: e.target.value })} className="field !min-h-11" /></label>
              <label className="text-sm text-gris">Hora<input type="time" step={900} value={visit.time} onChange={(e) => setVisit({ ...visit, time: e.target.value })} className="field !min-h-11" /></label>
              <label className="col-span-2 text-sm text-gris">Dirección<input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="field !min-h-11" placeholder="Calle, número, piso" /></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !visit.date || !visit.time}
                onClick={() => save({ visita: { start: madridToUtc(visit.date, visit.time).toISOString(), direccion: direccion || null } }, gcal ? "Visita guardada y en Google Calendar" : "Visita guardada")}
                className="btn-solid !min-h-11 !px-5 text-sm disabled:opacity-40"
              >
                {lead.visita_at ? "Cambiar visita" : "Agendar visita"}
              </button>
              {lead.visita_at && (
                <button type="button" disabled={busy} onClick={() => save({ visita: null }, "Visita anulada")} className="text-sm text-gris underline underline-offset-4">
                  Anular
                </button>
              )}
              {lead.visita_at && !gcal && (
                <a
                  target="_blank"
                  rel="noopener"
                  className="text-sm underline underline-offset-4"
                  href={googleTemplateUrl({
                    title: `Visita · ${lead.nombre ?? "Cliente"} · ${zoneLabel(lead.zona)}`,
                    start: new Date(lead.visita_at),
                    end: new Date(new Date(lead.visita_at).getTime() + 3_600_000),
                    details: [lead.telefono, lead.email, serviceNames(lead)].filter(Boolean).join("\n"),
                    location: [lead.visita_direccion, lead.codigo_postal].filter(Boolean).join(", "),
                  })}
                >
                  Pasar a Google Calendar
                </a>
              )}
            </div>
          </section>

          <section className="border-t border-piedra pt-6">
            <label className="block">
              <span className="label">Importe del presupuesto (€, sin IVA)</span>
              <div className="mt-1 flex items-end gap-3">
                <input value={quote} onChange={(e) => setQuote(e.target.value.replace(/[^\d,.]/g, ""))} inputMode="decimal" className="field tabular-nums" placeholder="Cuando lo envíes desde Billdu" />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const n = quote ? Math.round(Number(quote.replace(/\./g, "").replace(",", ".")) * 100) : null;
                    if (n != null && !Number.isFinite(n)) return setError("Importe no válido");
                    save({ presupuesto_importe_cents: n, ...(n != null && (lead.estado === "nueva" || lead.estado === "contactada" || lead.estado === "visita") ? { estado: "presupuesto_enviado" } : {}) }, "Importe guardado");
                  }}
                  className="btn-ghost !min-h-11 shrink-0 !px-5 text-sm"
                >
                  Guardar
                </button>
              </div>
            </label>
          </section>

          <section>
            <label className="block">
              <span className="label">Notas internas</span>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} className="field" placeholder="Lo que hablasteis, materiales, quién va a la visita…" />
            </label>
            <button type="button" disabled={busy} onClick={() => save({ notas: notas || null }, "Notas guardadas")} className="btn-ghost mt-3 !min-h-11 !px-5 text-sm">
              Guardar notas
            </button>
          </section>

          <p role="status" className="min-h-6 text-sm">
            {error ? <span className="text-[#a33a2a]">{error}</span> : saved ? <span className="inline-flex items-center gap-1.5 text-grafito"><svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>{saved}</span> : null}
          </p>

          <div className="border-t border-piedra pt-6">
            <button type="button" onClick={remove} className="text-sm text-[#a33a2a] underline underline-offset-4">
              Borrar los datos de esta persona
            </button>
            <p className="mt-1 text-xs text-gris">Úsalo si te pide que borréis sus datos. No se puede deshacer.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import "server-only";
import { site, siteUrl } from "@/content/site";
import { icsEvent } from "@/lib/agenda/calendar-links";
import { buildSlots, isSlotAvailable, visitEnd, type DaySlots } from "@/lib/agenda/slots";
import type { Lead } from "@/lib/leads/types";
import { formatEuros } from "@/lib/pricing/engine";
import { zoneDir, zoneLabel } from "@/lib/zones";
import { busyIntervals, createEvent, deleteEvent, gcalColorByDir, gcalConfigured } from "./gcal";
import { notifyVisit } from "./mail";
import { listVisits, updateLead } from "./store";

/** Ventana de búsqueda: los días laborables ofrecidos caben de sobra en 30 días. */
const horizon = (now: Date) => ({ from: now, to: new Date(now.getTime() + 30 * 86_400_000) });

async function context(now: Date, exceptLead?: Lead) {
  const { from, to } = horizon(now);
  const [busy, visits] = await Promise.all([
    busyIntervals(from, to).catch((e) => {
      console.error("[agenda] Google Calendar no responde", e);
      return [];
    }),
    listVisits(from, to),
  ]);
  // Si la persona ya tenía visita, su propio hueco no cuenta como ocupado al cambiarla.
  const own = exceptLead?.visita_at;
  const booked = visits
    .filter((v) => v.visita_at !== own)
    .map((v) => ({ start: new Date(v.visita_at), zoneId: v.zona }));
  // Las visitas ya creadas en Google también aparecen como ocupadas en freeBusy.
  const ownEvent = own ? { start: new Date(own), end: visitEnd(new Date(own)) } : null;
  const busyClean = ownEvent
    ? busy.filter((b) => !(b.start.getTime() === ownEvent.start.getTime() && b.end.getTime() === ownEvent.end.getTime()))
    : busy;
  return { busy: busyClean, booked };
}

export async function slotsFor(lead: Lead, now = new Date()): Promise<DaySlots[]> {
  const ctx = await context(now, lead);
  return buildSlots({ now, ...ctx, zoneId: lead.zona });
}

export class SlotTakenError extends Error {}

/**
 * Reserva (o cambia) la visita: comprueba que el hueco sigue libre, crea el
 * evento en Google Calendar si está conectado, guarda y avisa por email.
 */
export async function bookVisit(
  lead: Lead,
  input: { start: Date; nombre: string; telefono: string; direccion: string; nota?: string },
  now = new Date(),
): Promise<Lead> {
  const ctx = await context(now, lead);
  if (!isSlotAvailable(input.start.toISOString(), { now, ...ctx, zoneId: lead.zona })) throw new SlotTakenError();

  const end = visitEnd(input.start);
  const what = lead.servicios.length ? lead.servicios.join(", ") : "Visita";
  const details = [
    `${input.nombre} · ${input.telefono}${lead.email ? ` · ${lead.email}` : ""}`,
    `${input.direccion} (${lead.codigo_postal}, ${zoneLabel(lead.zona)})`,
    `Trabajos: ${what}`,
    lead.estimacion_base_cents != null ? `Estimación web: ${formatEuros(lead.estimacion_base_cents)} + IVA` : "",
    input.nota ? `Nota: ${input.nota}` : "",
    `Panel: ${siteUrl}/panel?s=${lead.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  let eventId: string | null = lead.visita_event_id;
  if (gcalConfigured()) {
    if (eventId) await deleteEvent(eventId).catch((e) => console.error("[agenda] No se pudo borrar el evento anterior", e));
    eventId = await createEvent({
      summary: `Visita · ${input.nombre} · ${zoneLabel(lead.zona)}`,
      description: details,
      location: `${input.direccion}, ${lead.codigo_postal}`,
      start: input.start,
      end,
      colorId: gcalColorByDir[zoneDir(lead.zona) ?? "centro"],
    }).catch((e) => {
      // La reserva se guarda igual: el aviso por email lleva el .ics para añadirla a mano.
      console.error("[agenda] No se pudo crear el evento en Google Calendar", e);
      return null;
    });
  }

  const notas = input.nota ? [lead.notas, `Cliente: ${input.nota}`].filter(Boolean).join("\n") : lead.notas;
  const updated = await updateLead(lead.id, {
    nombre: input.nombre,
    telefono: input.telefono,
    visita_at: input.start.toISOString(),
    visita_direccion: input.direccion,
    visita_event_id: eventId,
    estado: lead.estado === "nueva" || lead.estado === "contactada" ? "visita" : lead.estado,
    notas,
  });
  if (!updated) throw new Error("No se pudo guardar la visita");

  const ics = icsEvent({
    uid: `visita-${lead.id}@souto`,
    title: `Visita de ${site.name}`,
    start: input.start,
    end,
    details: `Visita para valorar: ${what}. Teléfono: ${site.phoneDisplay}`,
    location: `${input.direccion}, ${lead.codigo_postal}`,
  });
  await notifyVisit(updated, input.start, ics).catch((e) => console.error("[agenda] Aviso de visita", e));
  return updated;
}

/** Desde el panel: la empresa fija o cambia la visita a cualquier hora (sin comprobar huecos web). */
export async function setVisitFromPanel(lead: Lead, start: Date, direccion: string | null): Promise<Lead | null> {
  let eventId = lead.visita_event_id;
  if (gcalConfigured()) {
    if (eventId) await deleteEvent(eventId).catch(() => undefined);
    eventId = await createEvent({
      summary: `Visita · ${lead.nombre ?? lead.email ?? "Cliente"} · ${zoneLabel(lead.zona)}`,
      description: [lead.telefono, lead.email, `Panel: ${siteUrl}/panel?s=${lead.id}`].filter(Boolean).join("\n"),
      location: direccion ? `${direccion}, ${lead.codigo_postal}` : lead.codigo_postal,
      start,
      end: visitEnd(start),
      colorId: gcalColorByDir[zoneDir(lead.zona) ?? "centro"],
    }).catch((e) => (console.error("[panel] Google Calendar", e), null));
  }
  return updateLead(lead.id, {
    visita_at: start.toISOString(),
    visita_direccion: direccion,
    visita_event_id: eventId,
    estado: lead.estado === "nueva" || lead.estado === "contactada" ? "visita" : lead.estado,
  });
}

export async function cancelVisit(lead: Lead): Promise<Lead | null> {
  if (lead.visita_event_id) await deleteEvent(lead.visita_event_id).catch(() => undefined);
  return updateLead(lead.id, {
    visita_at: null,
    visita_event_id: null,
    estado: lead.estado === "visita" ? "contactada" : lead.estado,
  });
}

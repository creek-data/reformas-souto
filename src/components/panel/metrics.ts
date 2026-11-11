import { categories, groupLabel } from "@/content/catalog";
import { madridParts } from "@/lib/agenda/slots";
import { isEmailOnly, isOpen, type Lead } from "@/lib/leads/types";
import { zoneDir, zoneLabel, type ZoneDir } from "@/lib/zones";

/** Colores de zona (validados para daltonismo); siempre acompañados del nombre. */
export const zoneColor: Record<ZoneDir, string> = {
  centro: "#2a78d6",
  norte: "#eb6834",
  este: "#1baf7a",
  sur: "#eda100",
  oeste: "#e87ba4",
  fuera: "#6250d6",
};

const DAY = 86_400_000;
export const monthKey = (iso: string) => madridParts(new Date(iso)).date.slice(0, 7);
export const dayKey = (iso: string) => madridParts(new Date(iso)).date;

/** Valor de una solicitud: el presupuesto si ya hay, si no la estimación web. */
export const leadValue = (l: Lead) => l.presupuesto_importe_cents ?? l.estimacion_base_cents ?? null;

export function kpis(leads: Lead[], now: Date) {
  const thisMonth = monthKey(now.toISOString());
  const prev = new Date(now);
  prev.setUTCDate(1);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const prevMonth = monthKey(prev.toISOString());
  const dayOfMonth = Number(dayKey(now.toISOString()).slice(8));
  const inMonth = leads.filter((l) => monthKey(l.created_at) === thisMonth);
  // Comparación justa: el mes anterior hasta el mismo día.
  const prevSame = leads.filter((l) => monthKey(l.created_at) === prevMonth && Number(dayKey(l.created_at).slice(8)) <= dayOfMonth);
  const week = now.getTime() + 7 * DAY;
  const upcoming = leads.filter((l) => l.visita_at && isOpen(l) && new Date(l.visita_at) >= now && new Date(l.visita_at).getTime() <= week);
  const emailOnly = leads.filter((l) => isEmailOnly(l) && isOpen(l));
  const won = leads.filter((l) => l.estado === "ganada" && monthKey(l.updated_at) === thisMonth);
  return {
    month: inMonth.length,
    monthDelta: inMonth.length - prevSame.length,
    upcoming: upcoming.length,
    emailOnly: emailOnly.length,
    won: won.length,
    wonCents: won.reduce((s, l) => s + (leadValue(l) ?? 0), 0),
  };
}

/** Solicitudes por semana (lunes a domingo), últimas n semanas. */
export function weekly(leads: Lead[], now: Date, n = 8) {
  const today = new Date(`${dayKey(now.toISOString())}T12:00:00Z`);
  const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY);
  return Array.from({ length: n }, (_, i) => {
    const start = new Date(monday.getTime() - (n - 1 - i) * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    const count = leads.filter((l) => {
      const d = dayKey(l.created_at);
      return d >= s && d < e;
    }).length;
    const label = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).format(start).replace(".", "");
    return { label, count, current: i === n - 1 };
  });
}

/** Embudo de los últimos 90 días: de la primera solicitud a la obra aceptada. */
export function funnel(leads: Lead[], now: Date) {
  const recent = leads.filter((l) => now.getTime() - new Date(l.created_at).getTime() < 90 * DAY);
  const reached = (states: Lead["estado"][]) => recent.filter((l) => states.includes(l.estado)).length;
  return [
    { label: "Solicitudes", count: recent.length },
    { label: "Con teléfono", count: recent.filter((l) => l.telefono).length },
    { label: "Visita hecha o agendada", count: recent.filter((l) => l.visita_at).length },
    { label: "Presupuesto enviado", count: reached(["presupuesto_enviado", "ganada", "perdida"]) },
    { label: "Aceptadas", count: reached(["ganada"]) },
  ];
}

const catGroup = (id: string) => {
  const c = categories.find((x) => x.id === id);
  return c ? (c.group === "reformas" ? c.name : groupLabel.acabados) : "Otros";
};
const leadKind = (l: Lead) => (l.servicios.length ? catGroup(l.servicios.find((s) => categories.find((c) => c.id === s)?.group === "reformas") ?? l.servicios[0]!) : "Otros");

/** Valor en juego (solicitudes abiertas) por tipo de trabajo. */
export function valueByKind(leads: Lead[]) {
  const map = new Map<string, { cents: number; count: number; unknown: number }>();
  for (const l of leads.filter(isOpen)) {
    const k = leadKind(l);
    const v = leadValue(l);
    const cur = map.get(k) ?? { cents: 0, count: 0, unknown: 0 };
    cur.count++;
    if (v == null) cur.unknown++;
    else cur.cents += v;
    map.set(k, cur);
  }
  return [...map.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.count - a.count);
}

export function byZone(leads: Lead[]) {
  const map = new Map<ZoneDir, number>();
  for (const l of leads.filter(isOpen)) {
    const d = zoneDir(l.zona);
    if (d) map.set(d, (map.get(d) ?? 0) + 1);
  }
  return map;
}

export type Todo = { id: string; lead: Lead; title: string; why: string; action: "llamar" | "email" | "whatsapp"; priority: number };

/** Lo que conviene hacer hoy, ordenado por urgencia. */
export function todos(leads: Lead[], now: Date): Todo[] {
  const out: Todo[] = [];
  const t = now.getTime();
  const tomorrowEnd = new Date(`${dayKey(new Date(t + DAY).toISOString())}T23:59:59Z`).getTime();
  for (const l of leads) {
    if (!isOpen(l)) continue;
    const name = l.nombre ?? l.email ?? "Cliente";
    const age = (t - new Date(l.created_at).getTime()) / DAY;
    if (l.visita_at && new Date(l.visita_at).getTime() >= t && new Date(l.visita_at).getTime() <= tomorrowEnd) {
      out.push({ id: `v-${l.id}`, lead: l, title: `Visita a ${name}`, why: `${new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", weekday: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(l.visita_at))} · ${zoneLabel(l.zona)}`, action: "llamar", priority: 0 });
    } else if (l.estado === "nueva" && l.telefono) {
      out.push({ id: `n-${l.id}`, lead: l, title: `Llamar a ${name}`, why: age < 1 ? "Ha llegado hoy: cuanto antes, mejor" : `Lleva ${Math.floor(age) === 1 ? "1 día" : `${Math.floor(age)} días`} sin respuesta`, action: "llamar", priority: age < 1 ? 1 : 2 });
    } else if (isEmailOnly(l) && age < 30) {
      out.push({ id: `e-${l.id}`, lead: l, title: `Escribir a ${l.email}`, why: "Calculó su precio pero no ha pedido visita", action: "email", priority: 3 });
    } else if (l.estado === "presupuesto_enviado" && t - new Date(l.updated_at).getTime() > 5 * DAY) {
      out.push({ id: `p-${l.id}`, lead: l, title: `Preguntar a ${name} por el presupuesto`, why: `Enviado hace ${Math.floor((t - new Date(l.updated_at).getTime()) / DAY)} días`, action: "whatsapp", priority: 4 });
    }
  }
  return out.sort((a, b) => a.priority - b.priority);
}

/** Días en que ya hay visita en la misma zona que una solicitud sin visita. */
export function nearbyDays(lead: Lead, leads: Lead[], now: Date): string[] {
  if (!lead.zona) return [];
  const days = new Set<string>();
  for (const l of leads) {
    if (l.id === lead.id || !l.visita_at || l.zona !== lead.zona || !isOpen(l)) continue;
    if (new Date(l.visita_at) >= now) days.add(dayKey(l.visita_at));
  }
  return [...days].sort();
}

export const waNumber = (tel: string) => {
  const d = tel.replace(/\D/g, "");
  return d.startsWith("34") && d.length === 11 ? d : d.length === 9 ? `34${d}` : d;
};

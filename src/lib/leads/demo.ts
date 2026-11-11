import { estimate } from "@/lib/pricing/engine";
import { madridToUtc, madridParts } from "@/lib/agenda/slots";
import { zoneForCp } from "@/lib/zones";
import type { Estado, Lead } from "./types";

/**
 * Datos de EJEMPLO para enseñar el panel antes de tener solicitudes reales.
 * Personas inventadas; el panel lo indica siempre con un aviso visible.
 */

const names = [
  "Lucía M.", "Javier R.", "Carmen S.", "Andrés P.", "Marta G.", "Pablo L.", "Elena F.", "Raúl D.", "Nuria C.", "Sergio V.",
  "Paula T.", "Diego H.", "Irene B.", "Hugo N.", "Sara O.", "Óscar A.", "Laura E.", "Mario Q.", "Alba I.", "Iván K.",
];
const cps = ["28019", "28025", "28011", "28045", "28007", "28030", "28039", "28050", "28016", "28003", "28915", "28922", "28100", "28224", "28823", "28400", "19005"];

type Job = { servicios: string[]; lines?: { code: string; qty: number }[]; mensaje?: string; detalles?: string[] };
const jobs: Job[] = [
  { servicios: ["paredes"], lines: [{ code: "pintura-liso", qty: 180 }] },
  { servicios: ["paredes"], lines: [{ code: "alisado-gotele", qty: 95 }] },
  { servicios: ["paredes", "carpinteria"], lines: [{ code: "alisado-gotele", qty: 60 }, { code: "esmaltado-puertas", qty: 4 }] },
  { servicios: ["carpinteria"], lines: [{ code: "esmaltado-puertas", qty: 7 }] },
  { servicios: ["suelos"], lines: [{ code: "microcemento-con-malla", qty: 38 }] },
  { servicios: ["suelos"], lines: [{ code: "pintura-epoxi", qty: 120 }] },
  { servicios: ["pladur"], lines: [{ code: "pladur-lana-roca", qty: 14 }, { code: "encintado", qty: 14 }, { code: "pintura-pladur", qty: 14 }] },
  { servicios: ["banos"], detalles: ["Cambiar bañera por plato de ducha"], mensaje: "La bañera es antigua y queremos un plato de ducha." },
  { servicios: ["banos"], detalles: ["Reforma completa del baño"], mensaje: "Baño de unos 5 m², queremos cambiarlo todo." },
  { servicios: ["fontaneria"], detalles: ["Cambiar tuberías"], mensaje: "Tuberías de plomo en un piso de los 70." },
  { servicios: ["albanileria"], detalles: ["Tabiques"], mensaje: "Tirar un tabique entre cocina y salón." },
  { servicios: ["reformas"], detalles: ["Reforma de una vivienda"], mensaje: "Piso de 80 m² para entrar a vivir." },
  { servicios: ["muebles"], detalles: ["Lacar un mueble"], mensaje: "Aparador de madera de los años 60." },
];

/** Generador pseudoaleatorio con semilla: los mismos datos en cada carga. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function demoLeads(now = new Date()): Lead[] {
  const r = rng(7);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]!;
  const out: Lead[] = [];
  const today = madridParts(now).date;
  const times = ["09:00", "10:30", "12:00", "16:30", "18:00"];

  for (let i = 0; i < 38; i++) {
    const ageDays = Math.floor(Math.pow(r(), 1.3) * 56);
    const created = new Date(now.getTime() - ageDays * 86_400_000 - Math.floor(r() * 10) * 3_600_000);
    const job = pick(jobs);
    const cp = pick(cps);
    const priced = Boolean(job.lines);
    const est = job.lines ? estimate(job.lines, { location: cp.startsWith("280") ? "madrid" : "fuera" }) : null;
    const emailOnly = priced && r() < 0.3;

    let estado: Estado = "nueva";
    if (!emailOnly) {
      const x = r();
      if (ageDays > 20) estado = x < 0.35 ? "ganada" : x < 0.6 ? "perdida" : x < 0.85 ? "presupuesto_enviado" : "contactada";
      else if (ageDays > 6) estado = x < 0.15 ? "ganada" : x < 0.5 ? "presupuesto_enviado" : x < 0.75 ? "visita" : "contactada";
      else estado = x < 0.4 ? "nueva" : x < 0.7 ? "visita" : "contactada";
    }

    let visita_at: string | null = null;
    if (estado === "visita") {
      const d = new Date(`${today}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1 + Math.floor(r() * 9));
      while ([0, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
      visita_at = madridToUtc(d.toISOString().slice(0, 10), pick(times)).toISOString();
    } else if (["presupuesto_enviado", "ganada", "perdida"].includes(estado)) {
      visita_at = new Date(created.getTime() + 3 * 86_400_000).toISOString();
    }

    const quote =
      estado === "presupuesto_enviado" || estado === "ganada" || estado === "perdida"
        ? est
          ? Math.round((est.baseCents * (1 + r() * 0.25)) / 1000) * 1000
          : Math.round((2500 + r() * 9000)) * 100
        : null;

    out.push({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      tipo: priced ? "estimacion" : "contacto",
      estado,
      nombre: emailOnly ? null : names[i % names.length]!,
      telefono: emailOnly ? null : `6${String(10_000_000 + Math.floor(r() * 89_999_999))}`,
      email: priced ? `ejemplo${i}@correo.test` : r() < 0.5 ? `ejemplo${i}@correo.test` : null,
      codigo_postal: cp,
      zona: zoneForCp(cp).id,
      mensaje: job.mensaje ?? null,
      servicios: job.servicios,
      lineas: est?.lines ?? [],
      contexto: { demo: true, ...(job.detalles ? { detalles: job.detalles } : {}) },
      estimacion_base_cents: est?.baseCents ?? null,
      catalogo_version: est?.catalogVersion ?? null,
      presupuesto_importe_cents: quote,
      notas: null,
      visita_at,
      visita_direccion: visita_at ? "Calle de ejemplo, 1" : null,
      visita_event_id: null,
    });
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

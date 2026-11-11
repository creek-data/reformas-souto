import "server-only";
import { randomUUID } from "node:crypto";
import { demoLeads } from "@/lib/leads/demo";
import type { Lead, LeadInsert, LeadPatch } from "@/lib/leads/types";

/**
 * Almacén de solicitudes.
 * - supabase: producción (REST directo, clave de servicio solo en el servidor).
 * - memory: solo en desarrollo, para probar el flujo completo sin cuentas.
 *   Arranca con datos de ejemplo para ver el panel con vida.
 * - none: producción sin base de datos. Con PANEL_DEMO=true el panel enseña
 *   datos de ejemplo de solo lectura.
 */

export type StoreMode = "supabase" | "memory" | "none";

export const dbConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const storeMode = (): StoreMode =>
  dbConfigured() ? "supabase" : process.env.NODE_ENV !== "production" ? "memory" : "none";

const g = globalThis as unknown as { __soutoLeads?: Lead[] };
const memory = () => (g.__soutoLeads ??= process.env.PANEL_DEMO === "false" ? [] : demoLeads());

/** El panel puede guardar cambios (en modo demostración sin base de datos, no). */
export const canWrite = () => storeMode() !== "none";

const headers = (extra: Record<string, string> = {}) => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});
const rest = (path: string) => `${process.env.SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/${path}`;

async function supa<T>(path: string, init: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(rest(path), { ...init, headers: headers(init.headers), signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

const COLUMNS =
  "id,created_at,updated_at,tipo,estado,nombre,telefono,email,codigo_postal,zona,mensaje,servicios,lineas,contexto,estimacion_base_cents,catalogo_version,presupuesto_importe_cents,notas,visita_at,visita_direccion,visita_event_id";

export async function insertLead(row: LeadInsert): Promise<Lead | null> {
  const mode = storeMode();
  if (mode === "supabase") {
    const rows = await supa<Lead[]>("solicitudes?select=" + COLUMNS, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    return rows[0] ?? null;
  }
  if (mode === "memory") {
    const now = new Date().toISOString();
    const { consentimiento_version: _c, ip_hash: _i, user_agent: _u, ...rest } = row;
    const lead: Lead = {
      ...rest,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
      estado: "nueva",
      notas: null,
      presupuesto_importe_cents: null,
      visita_at: null,
      visita_direccion: null,
      visita_event_id: null,
    };
    memory().unshift(lead);
    return lead;
  }
  return null;
}

export async function getLead(id: string): Promise<Lead | null> {
  const mode = storeMode();
  if (mode === "supabase") {
    const rows = await supa<Lead[]>(`solicitudes?id=eq.${encodeURIComponent(id)}&select=${COLUMNS}`);
    return rows[0] ?? null;
  }
  if (mode === "memory") return memory().find((l) => l.id === id) ?? null;
  return null;
}

export async function updateLead(id: string, patch: LeadPatch): Promise<Lead | null> {
  const mode = storeMode();
  if (mode === "supabase") {
    const rows = await supa<Lead[]>(`solicitudes?id=eq.${encodeURIComponent(id)}&select=${COLUMNS}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    return rows[0] ?? null;
  }
  if (mode === "memory") {
    const l = memory().find((x) => x.id === id);
    if (!l) return null;
    Object.assign(l, patch, { updated_at: new Date().toISOString() });
    return l;
  }
  return null;
}

export async function listLeads(limit = 1000): Promise<Lead[]> {
  const mode = storeMode();
  if (mode === "supabase") return supa<Lead[]>(`solicitudes?select=${COLUMNS}&order=created_at.desc&limit=${limit}`);
  if (mode === "memory") return memory().slice(0, limit);
  return process.env.PANEL_DEMO === "true" ? demoLeads() : [];
}

export async function deleteLead(id: string): Promise<boolean> {
  const mode = storeMode();
  if (mode === "supabase") {
    const rows = await supa<{ id: string }[]>(`solicitudes?id=eq.${encodeURIComponent(id)}&select=id`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    return rows.length > 0;
  }
  if (mode === "memory") {
    const list = memory();
    const i = list.findIndex((l) => l.id === id);
    if (i >= 0) list.splice(i, 1);
    return i >= 0;
  }
  return false;
}

/** Visitas ya reservadas en un intervalo (para no solaparlas y agrupar por zona). */
export async function listVisits(from: Date, to: Date): Promise<{ visita_at: string; zona: string | null }[]> {
  const mode = storeMode();
  if (mode === "supabase") {
    return supa(
      `solicitudes?select=visita_at,zona&visita_at=gte.${from.toISOString()}&visita_at=lt.${to.toISOString()}&estado=neq.perdida`,
    );
  }
  if (mode === "memory") {
    return memory()
      .filter((l) => l.visita_at && l.estado !== "perdida" && new Date(l.visita_at) >= from && new Date(l.visita_at) < to)
      .map((l) => ({ visita_at: l.visita_at!, zona: l.zona }));
  }
  return [];
}

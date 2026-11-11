import type { EstimateLine } from "@/lib/pricing/engine";

/** Fila de la tabla `solicitudes` (Supabase) tal y como la usa el panel. */

export const ESTADOS = ["nueva", "contactada", "visita", "presupuesto_enviado", "ganada", "perdida"] as const;
export type Estado = (typeof ESTADOS)[number];

export const estadoLabel: Record<Estado, string> = {
  nueva: "Sin contactar",
  contactada: "Contactada",
  visita: "Visita agendada",
  presupuesto_enviado: "Presupuesto enviado",
  ganada: "Aceptada",
  perdida: "No sigue",
};

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  tipo: "contacto" | "estimacion";
  estado: Estado;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  codigo_postal: string;
  zona: string | null;
  mensaje: string | null;
  servicios: string[];
  lineas: EstimateLine[];
  contexto: Record<string, unknown>;
  estimacion_base_cents: number | null;
  catalogo_version: string | null;
  presupuesto_importe_cents: number | null;
  notas: string | null;
  visita_at: string | null;
  visita_direccion: string | null;
  visita_event_id: string | null;
}

export type LeadInsert = Omit<Lead, "id" | "created_at" | "updated_at" | "estado" | "notas" | "presupuesto_importe_cents" | "visita_at" | "visita_direccion" | "visita_event_id"> & {
  consentimiento_version: string;
  ip_hash: string | null;
  user_agent: string | null;
};

export type LeadPatch = Partial<
  Pick<Lead, "estado" | "nombre" | "telefono" | "notas" | "presupuesto_importe_cents" | "visita_at" | "visita_direccion" | "visita_event_id" | "zona">
>;

/** Solo dejó el email en la calculadora: aún no sabemos su teléfono. */
export const isEmailOnly = (l: Pick<Lead, "telefono" | "visita_at">) => !l.telefono && !l.visita_at;

/** Estados en los que la solicitud sigue viva. */
export const isOpen = (l: Pick<Lead, "estado">) => l.estado !== "ganada" && l.estado !== "perdida";

/** Solicitud inventada para enseñar el panel (ver demo.ts). */
export const isDemoLead = (l: Pick<Lead, "contexto">) => l.contexto?.demo === true;

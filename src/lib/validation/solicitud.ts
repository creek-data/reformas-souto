import { z } from "zod";
import { MAX_QTY } from "@/lib/pricing/engine";

/** Esquemas compartidos por los formularios (cliente) y la API (servidor). */

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .refine((v) => /^(\+34|0034)?[6789]\d{8}$/.test(v) || /^\+\d{8,15}$/.test(v), {
    message: "Escribe un teléfono válido",
  });

const optionalEmail = z
  .string()
  .trim()
  .max(160)
  .optional()
  .transform((v) => (v ? v.toLowerCase() : undefined))
  .pipe(z.email("Escribe un email válido").optional());

const requiredEmail = z.string().trim().max(160).toLowerCase().pipe(z.email("Escribe un email válido"));

const optionalName = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));

export const cpSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Código postal de 5 cifras")
  .refine((v) => Number(v.slice(0, 2)) >= 1 && Number(v.slice(0, 2)) <= 52, "Ese código postal no existe");

export const lineSchema = z.object({
  code: z.string().min(1).max(60),
  qty: z.number().positive().max(MAX_QTY),
});

const common = {
  codigoPostal: cpSchema,
  mensaje: z.string().trim().max(2000).optional(),
  servicios: z.array(z.string().max(40)).max(12).optional(),
  /** Opciones rápidas elegidas en trabajos con visita («Cambiar bañera por plato…»). */
  detalles: z.array(z.string().max(80)).max(12).optional(),
  consentimiento: z.literal(true, { message: "Necesitamos tu consentimiento para responderte" }),
  /** Trampa para bots: debe llegar vacío. */
  website: z.string().max(0).optional().or(z.literal("")),
  /** Momento en que se abrió el formulario (ms). */
  startedAt: z.number().int().positive(),
  turnstileToken: z.string().max(2048).optional(),
};

/** Calculadora: el email es obligatorio para ver el desglose completo. */
export const estimacionSchema = z.object({
  tipo: z.literal("estimacion"),
  email: requiredEmail,
  nombre: optionalName,
  lineas: z.array(lineSchema).min(1, "Añade al menos una medida").max(20),
  ...common,
});

/** Formulario de contacto y trabajos con visita (baños, fontanería…). */
export const contactoSchema = z.object({
  tipo: z.literal("contacto"),
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(100),
  telefono: phoneSchema,
  email: optionalEmail,
  ...common,
});

export const solicitudSchema = z.discriminatedUnion("tipo", [estimacionSchema, contactoSchema]);

export type SolicitudInput = z.input<typeof solicitudSchema>;
export type Solicitud = z.output<typeof solicitudSchema>;

/**
 * Reserva de visita o petición de llamada sobre una solicitud ya creada.
 * `l` y `t` identifican la solicitud con un token firmado (sin cuentas).
 */
export const reservaSchema = z
  .object({
    l: z.uuid(),
    t: z.string().min(10).max(200),
    /** Inicio de la visita (ISO). Sin él, solo pide que le llamemos. */
    start: z.iso.datetime().optional(),
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(100),
    telefono: phoneSchema,
    direccion: z.string().trim().max(200).optional(),
    nota: z.string().trim().max(1000).optional(),
  })
  .refine((v) => !v.start || (v.direccion && v.direccion.length >= 5), {
    path: ["direccion"],
    message: "Escribe la dirección de la obra",
  });

export type ReservaInput = z.input<typeof reservaSchema>;

/** Primer error de cada campo, listo para pintar en el formulario. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

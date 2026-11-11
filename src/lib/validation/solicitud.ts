import { z } from "zod";
import { MAX_QTY } from "@/lib/pricing/engine";

/** Esquema compartido por el formulario (cliente) y la API (servidor). */

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .refine((v) => /^(\+34|0034)?[6789]\d{8}$/.test(v) || /^\+\d{8,15}$/.test(v), {
    message: "Escribe un teléfono válido",
  });

export const lineSchema = z.object({
  code: z.string().min(1).max(60),
  qty: z.number().positive().max(MAX_QTY),
});

export const solicitudSchema = z.object({
  tipo: z.enum(["contacto", "calculadora"]),
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(100),
  telefono: phone,
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.email("Escribe un email válido").optional()),
  codigoPostal: z.string().trim().regex(/^\d{5}$/, "Código postal de 5 cifras"),
  mensaje: z.string().trim().max(2000).optional(),
  servicios: z.array(z.string().max(40)).max(10).optional(),
  lineas: z.array(lineSchema).max(20).optional(),
  contexto: z
    .object({
      condition: z.enum(["buena", "desperfectos", "no-se"]).optional(),
      location: z.enum(["madrid", "fuera"]).optional(),
      inmueble: z.enum(["vivienda", "local", "comunidad"]).optional(),
    })
    .optional(),
  consentimiento: z.literal(true, { message: "Necesitamos tu consentimiento para responderte" }),
  /** Trampa para bots: debe llegar vacío. */
  website: z.string().max(0).optional().or(z.literal("")),
  /** Momento en que se abrió el formulario (ms). */
  startedAt: z.number().int().positive(),
  turnstileToken: z.string().max(2048).optional(),
});

export type SolicitudInput = z.input<typeof solicitudSchema>;
export type Solicitud = z.output<typeof solicitudSchema>;

/** Primer error de cada campo, listo para pintar en el formulario. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

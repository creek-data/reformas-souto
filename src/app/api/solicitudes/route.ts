import { categories } from "@/content/catalog";
import { consentVersion } from "@/content/site";
import type { LeadInsert } from "@/lib/leads/types";
import { EstimateError, estimate, type Estimate } from "@/lib/pricing/engine";
import { fail, json, readJson, sameOrigin } from "@/lib/server/http";
import { notifyNewLead, sendEstimateToClient } from "@/lib/server/mail";
import { clientIp, hashIp, rateLimited, tooFast, verifyTurnstile } from "@/lib/server/protect";
import { leadToken } from "@/lib/server/secret";
import { insertLead, storeMode } from "@/lib/server/store";
import { fieldErrors, solicitudSchema } from "@/lib/validation/solicitud";
import { isMadridCapital, zoneForCp } from "@/lib/zones";
import { siteUrl } from "@/content/site";

export const runtime = "nodejs";

const BOT_OK = { ok: true, lead: null, estimate: null };

/**
 * Crea una solicitud.
 * - estimacion: la calculadora. El email es obligatorio; a cambio devolvemos el
 *   desglose completo y se lo enviamos por correo.
 * - contacto: formulario, trabajos con visita (baños, fontanería…).
 * Devuelve el id y un token firmado para reservar la visita sin cuenta.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido", 403);
  const read = await readJson(req);
  if ("error" in read) return read.error;
  const body = read.body;

  // Trampa para bots: se responde «ok» sin guardar nada.
  if (typeof body === "object" && body && "website" in body && (body as { website?: unknown }).website) return json(BOT_OK);

  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const s = parsed.data;
  if (tooFast(s.startedAt)) return json(BOT_OK);

  const ip = clientIp(req.headers);
  if (rateLimited(`sol:${ip}`)) return fail("Demasiados envíos seguidos. Inténtalo en unos minutos o llámanos.", 429);
  if (!(await verifyTurnstile(s.turnstileToken, ip))) return fail("No hemos podido verificar el envío. Recarga la página.", 400);

  const location = isMadridCapital(s.codigoPostal) ? "madrid" : "fuera";

  // El importe se recalcula SIEMPRE en el servidor con el catálogo validado.
  let est: Estimate | null = null;
  if (s.tipo === "estimacion") {
    try {
      est = estimate(s.lineas, { location });
    } catch (e) {
      if (e instanceof EstimateError) return fail("Alguna medida no es válida. Revísala.", 422);
      throw e;
    }
  }

  const validCats = new Set<string>(categories.map((c) => c.id));
  const row: LeadInsert = {
    tipo: s.tipo,
    nombre: s.nombre ?? null,
    telefono: s.tipo === "contacto" ? s.telefono : null,
    email: s.email ?? null,
    codigo_postal: s.codigoPostal,
    zona: zoneForCp(s.codigoPostal).id,
    mensaje: s.mensaje ?? null,
    servicios: (s.servicios ?? []).filter((x) => validCats.has(x) || /^[a-z-]+$/.test(x)),
    lineas: est?.lines ?? [],
    contexto: { location, ...(s.detalles?.length ? { detalles: s.detalles } : {}) },
    estimacion_base_cents: est?.baseCents ?? null,
    catalogo_version: est?.catalogVersion ?? null,
    consentimiento_version: consentVersion,
    ip_hash: hashIp(ip),
    user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  };

  let lead = null;
  try {
    lead = await insertLead(row);
  } catch (e) {
    console.error("[solicitudes] No se pudo guardar", e);
  }

  // Sin base de datos aún podemos avisar por email con los datos recibidos.
  const forMail = lead ?? {
    ...row,
    id: "sin-guardar",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    estado: "nueva" as const,
    notas: null,
    presupuesto_importe_cents: null,
    visita_at: null,
    visita_direccion: null,
    visita_event_id: null,
  };
  const token = lead ? leadToken(lead.id) : null;
  const bookUrl = lead ? `${siteUrl}/reservar?l=${lead.id}&t=${token}` : `${siteUrl}/contacto`;

  const [notified, emailed] = await Promise.all([
    notifyNewLead(forMail, est).catch((e) => (console.error("[solicitudes] Aviso", e), false)),
    est ? sendEstimateToClient(forMail, est, bookUrl).catch((e) => (console.error("[solicitudes] Email cliente", e), false)) : null,
  ]);

  if (!lead && !notified) {
    console.error(`[solicitudes] Ni guardada ni avisada (almacén: ${storeMode()})`);
    // La calculadora sigue mostrando el precio: la persona no tiene la culpa.
    if (est) return json({ ok: true, lead: null, estimate: est, saved: false });
    return fail("No hemos podido enviar tu solicitud. Llámanos o escríbenos por WhatsApp.", 503);
  }

  return json({
    ok: true,
    lead: lead ? { id: lead.id, token, zona: lead.zona } : null,
    estimate: est,
    saved: true,
    emailed: emailed === true,
  });
}

import type { Lead } from "@/lib/leads/types";
import { bookVisit, slotsFor, SlotTakenError } from "@/lib/server/booking";
import { fail, json, readJson, sameOrigin } from "@/lib/server/http";
import { notifyNewLead } from "@/lib/server/mail";
import { clientIp, rateLimited } from "@/lib/server/protect";
import { checkLeadToken } from "@/lib/server/secret";
import { getLead, updateLead } from "@/lib/server/store";
import { fieldErrors, reservaSchema } from "@/lib/validation/solicitud";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

async function leadFrom(l: string | null, t: string | null): Promise<Lead | null> {
  if (!l || !t || !UUID.test(l) || !checkLeadToken(l, t)) return null;
  return getLead(l);
}

/** Lo que ve quien abre su enlace de reserva: huecos libres y sus datos para no repetirlos. */
function publicLead(l: Lead) {
  return {
    nombre: l.nombre,
    telefono: l.telefono,
    email: l.email,
    codigoPostal: l.codigo_postal,
    visita: l.visita_at,
    direccion: l.visita_direccion,
    estimacionCents: l.estimacion_base_cents,
    servicios: l.servicios,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lead = await leadFrom(url.searchParams.get("l"), url.searchParams.get("t"));
  if (!lead) return fail("Este enlace no es válido o ha caducado. Llámanos y te buscamos un hueco.", 404);
  return json({ ok: true, lead: publicLead(lead), days: await slotsFor(lead) });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido", 403);
  const read = await readJson(req, 5000);
  if ("error" in read) return read.error;
  const parsed = reservaSchema.safeParse(read.body);
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const r = parsed.data;

  if (rateLimited(`res:${clientIp(req.headers)}`)) return fail("Demasiados intentos seguidos. Llámanos y lo cerramos por teléfono.", 429);
  const lead = await leadFrom(r.l, r.t);
  if (!lead) return fail("Este enlace no es válido o ha caducado. Llámanos y te buscamos un hueco.", 404);

  // Sin hora: prefiere que le llamemos.
  if (!r.start) {
    const notas = r.nota ? [lead.notas, `Cliente: ${r.nota}`].filter(Boolean).join("\n") : lead.notas;
    const updated = await updateLead(lead.id, { nombre: r.nombre, telefono: r.telefono, notas });
    if (!updated) return fail("No hemos podido guardar tus datos. Llámanos.", 500);
    await notifyNewLead(updated, null, "Quiere que le llaméis").catch(() => false);
    return json({ ok: true, visit: null });
  }

  try {
    const updated = await bookVisit(lead, {
      start: new Date(r.start),
      nombre: r.nombre,
      telefono: r.telefono,
      direccion: r.direccion!,
      nota: r.nota,
    });
    return json({ ok: true, visit: { start: updated.visita_at, direccion: updated.visita_direccion } });
  } catch (e) {
    if (e instanceof SlotTakenError) {
      return json({ ok: false, error: "Ese hueco se acaba de ocupar. Elige otro, por favor.", days: await slotsFor(lead) }, 409);
    }
    console.error("[agenda] Error al reservar", e);
    return fail("No hemos podido reservar la visita. Llámanos y la cerramos por teléfono.", 500);
  }
}

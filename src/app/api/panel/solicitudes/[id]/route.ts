import { z } from "zod";
import { ESTADOS } from "@/lib/leads/types";
import { cancelVisit, setVisitFromPanel } from "@/lib/server/booking";
import { fail, json, readJson, sameOrigin } from "@/lib/server/http";
import { hasPanelAccess } from "@/lib/server/panel-auth";
import { canWrite, deleteLead, getLead, updateLead } from "@/lib/server/store";

export const runtime = "nodejs";

const patchSchema = z.object({
  estado: z.enum(ESTADOS).optional(),
  notas: z.string().max(5000).nullable().optional(),
  presupuesto_importe_cents: z.number().int().min(0).max(100_000_000).nullable().optional(),
  /** Fijar visita (ISO + dirección) o anularla (null). */
  visita: z.object({ start: z.iso.datetime(), direccion: z.string().trim().max(200).nullable() }).nullable().optional(),
});

async function guard(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido", 403);
  if (!(await hasPanelAccess())) return fail("Sesión caducada. Vuelve a entrar.", 401);
  if (!canWrite()) return fail("Modo demostración: los cambios no se guardan.", 409);
  return null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const read = await readJson(req, 10_000);
  if ("error" in read) return read.error;
  const parsed = patchSchema.safeParse(read.body);
  if (!parsed.success) return fail("Datos no válidos", 422);
  const lead = await getLead((await params).id);
  if (!lead) return fail("No existe", 404);

  const { visita, ...rest } = parsed.data;
  let updated = lead;
  if (visita === null) updated = (await cancelVisit(updated)) ?? updated;
  else if (visita) updated = (await setVisitFromPanel(updated, new Date(visita.start), visita.direccion)) ?? updated;
  if (Object.keys(rest).length) updated = (await updateLead(lead.id, rest)) ?? updated;
  return json({ ok: true, lead: updated });
}

/** Borrado definitivo (por ejemplo, si la persona ejerce su derecho de supresión). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const lead = await getLead((await params).id);
  if (!lead) return fail("No existe", 404);
  if (lead.visita_at) await cancelVisit(lead);
  return json({ ok: await deleteLead(lead.id) });
}

import { NextResponse } from "next/server";
import { consentVersion } from "@/content/site";
import { EstimateError, estimate } from "@/lib/pricing/engine";
import { clientIp, hashIp, rateLimited, tooFast, verifyTurnstile } from "@/lib/server/protect";
import { dbConfigured, mailConfigured, notifyByEmail, saveToDatabase } from "@/lib/server/sinks";
import { fieldErrors, solicitudSchema } from "@/lib/validation/solicitud";

export const runtime = "nodejs";

const ok = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Formato no válido" }, { status: 415 });
  }
  const raw = await req.text();
  if (raw.length > 20_000) return NextResponse.json({ ok: false, error: "Solicitud demasiado grande" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Formato no válido" }, { status: 400 });
  }

  // Trampa para bots: se responde «ok» sin guardar nada.
  if (typeof body === "object" && body && "website" in body && (body as { website?: unknown }).website) return ok();

  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }
  const s = parsed.data;
  if (tooFast(s.startedAt)) return ok();

  const ip = clientIp(req.headers);
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Demasiados envíos. Inténtalo más tarde o llámanos." }, { status: 429 });
  }
  if (!(await verifyTurnstile(s.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: "No hemos podido verificar el envío. Recarga la página." }, { status: 400 });
  }

  // El importe se recalcula SIEMPRE en el servidor con el catálogo validado.
  let est = null;
  if (s.lineas?.length) {
    try {
      est = estimate(s.lineas, s.contexto ?? {});
    } catch (e) {
      if (e instanceof EstimateError) {
        return NextResponse.json({ ok: false, error: "Alguna partida no es válida." }, { status: 422 });
      }
      throw e;
    }
  }

  const record = {
    solicitud: s,
    estimate: est,
    ipHash: hashIp(ip),
    userAgent: req.headers.get("user-agent"),
    consentVersion,
  };

  if (!dbConfigured() && !mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[solicitudes] Sin base de datos ni email configurados");
      return NextResponse.json(
        { ok: false, error: "No hemos podido enviar tu solicitud. Llámanos o escríbenos por WhatsApp." },
        { status: 503 },
      );
    }
    console.info("[solicitudes] (desarrollo) solicitud recibida", { tipo: s.tipo, base: est?.baseCents ?? null });
    return ok();
  }

  const [saved, mailed] = await Promise.allSettled([saveToDatabase(record), notifyByEmail(record)]);
  const stored = saved.status === "fulfilled" && saved.value !== null;
  const notified = mailed.status === "fulfilled" && mailed.value;
  if (!stored && !notified) {
    console.error("[solicitudes] Fallo al guardar y al avisar", saved, mailed);
    return NextResponse.json(
      { ok: false, error: "No hemos podido enviar tu solicitud. Llámanos o escríbenos por WhatsApp." },
      { status: 502 },
    );
  }
  return ok();
}

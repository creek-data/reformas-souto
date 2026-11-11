import "server-only";
import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ ok: false, error, ...extra }, status);

/** Lee un cuerpo JSON con límite de tamaño. Devuelve una respuesta de error si no vale. */
export async function readJson(req: Request, maxBytes = 20_000): Promise<{ body: unknown } | { error: NextResponse }> {
  if (!req.headers.get("content-type")?.includes("application/json")) return { error: fail("Formato no válido", 415) };
  const raw = await req.text();
  if (raw.length > maxBytes) return { error: fail("Solicitud demasiado grande", 413) };
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { error: fail("Formato no válido", 400) };
  }
}

/** Las peticiones que cambian datos tienen que venir de la propia web. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // navegadores antiguos o llamadas del mismo servidor
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

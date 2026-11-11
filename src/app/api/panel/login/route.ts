import { fail, json, readJson, sameOrigin } from "@/lib/server/http";
import { checkPassword, COOKIE, cookieOptions, sessionValue } from "@/lib/server/panel-auth";
import { clientIp, rateLimited } from "@/lib/server/protect";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido", 403);
  if (rateLimited(`login:${clientIp(req.headers)}`)) return fail("Demasiados intentos. Espera unos minutos.", 429);
  const read = await readJson(req, 1000);
  if ("error" in read) return read.error;
  const pass = (read.body as { password?: unknown })?.password;
  if (typeof pass !== "string" || !checkPassword(pass)) return fail("Contraseña incorrecta", 401);
  const res = json({ ok: true });
  res.cookies.set(COOKIE, sessionValue(), cookieOptions);
  return res;
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return fail("Origen no permitido", 403);
  const res = json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}

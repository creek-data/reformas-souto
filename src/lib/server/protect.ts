import "server-only";
import { createHash } from "node:crypto";

/**
 * Límite de peticiones en memoria (por instancia). Suficiente para el volumen
 * de una pyme; si se escala a varias instancias, mover a Postgres o Redis.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function rateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

/** Envíos en menos de 3 s suelen ser bots. */
export const tooFast = (startedAt: number, now = Date.now()) => now - startedAt < 3000;

/** Guardamos un hash de la IP, no la IP (minimización de datos). */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "souto";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

/** Cloudflare Turnstile: solo se exige si hay clave secreta configurada. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!res?.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

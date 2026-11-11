import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Secreto de la aplicación para firmar enlaces de reserva y la sesión del panel.
 * En producción debe venir de APP_SECRET. Si falta, se genera uno aleatorio por
 * instancia: funciona, pero las firmas no sobreviven a un reinicio.
 */
let fallback: string | undefined;
function secret(): string {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  if (!fallback) {
    fallback = process.env.NODE_ENV === "production" ? randomBytes(32).toString("hex") : "solo-desarrollo";
    if (process.env.NODE_ENV === "production") console.warn("[souto] Falta APP_SECRET: usando un secreto temporal");
  }
  return fallback;
}

export const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

export function verify(value: string, signature: string): boolean {
  const a = Buffer.from(sign(value));
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Token que permite a quien pidió el precio reservar su visita sin cuenta. */
export const leadToken = (id: string) => sign(`lead:${id}`);
export const checkLeadToken = (id: string, token: string) => verify(`lead:${id}`, token);

export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

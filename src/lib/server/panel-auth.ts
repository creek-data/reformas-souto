import "server-only";
import { cookies } from "next/headers";
import { safeEqual, sign, verify } from "./secret";

/**
 * Acceso al panel con una contraseña compartida por la empresa (PANEL_PASSWORD)
 * y una cookie firmada, HttpOnly. Suficiente para 1–3 personas; si crece el
 * equipo, pasar a usuarios individuales (Supabase Auth).
 */

export const COOKIE = "souto_panel";
const DAYS = 30;
const DEV_PASSWORD = "souto-local";

export const isProd = () => process.env.NODE_ENV === "production";
export const demoMode = () => process.env.PANEL_DEMO === "true";
const password = () => process.env.PANEL_PASSWORD || (isProd() ? "" : DEV_PASSWORD);

export type PanelAccess = "open-demo" | "login" | "disabled";

/** Cómo se entra: con contraseña, abierto en modo demostración o desactivado. */
export function panelAccess(): PanelAccess {
  if (password()) return "login";
  return demoMode() ? "open-demo" : "disabled";
}

export const devPasswordHint = () => (!isProd() && !process.env.PANEL_PASSWORD ? DEV_PASSWORD : null);

export const checkPassword = (input: string) => Boolean(password()) && safeEqual(input, password());

export function sessionValue(now = Date.now()) {
  const exp = String(now + DAYS * 86_400_000);
  return `${exp}.${sign(`panel:${exp}`)}`;
}

export const cookieOptions = {
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: DAYS * 86_400,
};

export function validSession(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < now) return false;
  return verify(`panel:${exp}`, sig);
}

export async function hasPanelAccess(): Promise<boolean> {
  const access = panelAccess();
  if (access === "open-demo") return true;
  if (access === "disabled") return false;
  return validSession((await cookies()).get(COOKIE)?.value);
}

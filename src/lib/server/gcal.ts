import "server-only";
import { createSign } from "node:crypto";

/**
 * Google Calendar con una cuenta de servicio (sin dependencias).
 * Configuración: crear la cuenta de servicio en Google Cloud, compartir con su
 * email el calendario de la empresa con permiso «Hacer cambios en eventos» y
 * definir GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY.
 */

export const gcalConfigured = () =>
  Boolean(process.env.GOOGLE_CALENDAR_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);

let cached: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google token ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

const calendarId = () => encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);

/** Huecos ocupados en el calendario de la empresa. */
export async function busyIntervals(from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
  if (!gcalConfigured()) return [];
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: "Europe/Madrid", items: [{ id: process.env.GOOGLE_CALENDAR_ID }] }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google freeBusy ${res.status}`);
  const data = (await res.json()) as { calendars: Record<string, { busy?: { start: string; end: string }[] }> };
  const cal = Object.values(data.calendars)[0];
  return (cal?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

export async function createEvent(e: {
  summary: string;
  description: string;
  location?: string;
  start: Date;
  end: Date;
  colorId?: string;
}): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId()}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: e.summary,
      description: e.description,
      location: e.location,
      colorId: e.colorId,
      start: { dateTime: e.start.toISOString(), timeZone: "Europe/Madrid" },
      end: { dateTime: e.end.toISOString(), timeZone: "Europe/Madrid" },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google event ${res.status}`);
  return ((await res.json()) as { id: string }).id;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!gcalConfigured()) return;
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId()}/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${await accessToken()}` },
    signal: AbortSignal.timeout(8000),
  });
}

/** Colores de evento de Google por zona, para ver la semana agrupada de un vistazo. */
export const gcalColorByDir: Record<string, string> = { centro: "8", norte: "9", este: "6", sur: "10", oeste: "3", fuera: "11" };

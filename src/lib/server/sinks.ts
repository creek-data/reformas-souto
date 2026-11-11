import "server-only";
import { site } from "@/content/site";
import { formatEuros, type Estimate } from "@/lib/pricing/engine";
import type { Solicitud } from "@/lib/validation/solicitud";

/**
 * Destinos de una solicitud: base de datos (Supabase) y aviso por email (Resend).
 * Se usan las APIs REST directamente para no añadir dependencias.
 * Las claves viven solo en variables de entorno del servidor.
 */

export interface StoredRequest {
  solicitud: Solicitud;
  estimate: Estimate | null;
  ipHash: string;
  userAgent: string | null;
  consentVersion: string;
}

export const dbConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const mailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_TO && process.env.EMAIL_FROM);

export async function saveToDatabase(r: StoredRequest): Promise<string | null> {
  if (!dbConfigured()) return null;
  const { solicitud: s, estimate } = r;
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/solicitudes`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      tipo: s.tipo,
      nombre: s.nombre,
      telefono: s.telefono,
      email: s.email ?? null,
      codigo_postal: s.codigoPostal,
      mensaje: s.mensaje ?? null,
      servicios: s.servicios ?? [],
      lineas: estimate?.lines ?? [],
      contexto: s.contexto ?? {},
      estimacion_base_cents: estimate?.baseCents ?? null,
      catalogo_version: estimate?.catalogVersion ?? null,
      consentimiento_version: r.consentVersion,
      ip_hash: r.ipHash,
      user_agent: r.userAgent?.slice(0, 300) ?? null,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const rows = (await res.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function notifyByEmail(r: StoredRequest): Promise<boolean> {
  if (!mailConfigured()) return false;
  const { solicitud: s, estimate } = r;
  const lines = estimate
    ? `<ul>${estimate.lines
        .map((l) => `<li>${esc(l.name)}: ${l.qty} × ${formatEuros(l.unitPriceCents)} = ${formatEuros(l.totalCents)}</li>`)
        .join("")}</ul><p><strong>Base orientativa: ${formatEuros(estimate.baseCents)} + IVA</strong></p>`
    : "";
  const html = `<h2>Nueva solicitud (${esc(s.tipo)})</h2>
<p><strong>${esc(s.nombre)}</strong><br>Tel.: ${esc(s.telefono)}<br>${s.email ? `Email: ${esc(s.email)}<br>` : ""}CP: ${esc(s.codigoPostal)}</p>
${s.servicios?.length ? `<p>Servicios: ${s.servicios.map(esc).join(", ")}</p>` : ""}
${s.mensaje ? `<p>${esc(s.mensaje).replace(/\n/g, "<br>")}</p>` : ""}${lines}`;

  const send = (to: string, subject: string, body: string, replyTo?: string) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html: body, reply_to: replyTo }),
      signal: AbortSignal.timeout(8000),
    });

  const res = await send(process.env.NOTIFY_EMAIL_TO!, `Solicitud web: ${s.nombre} (${s.codigoPostal})`, html, s.email);
  if (s.email) {
    await send(
      s.email,
      `Hemos recibido tu solicitud · ${site.name}`,
      `<p>Hola, ${esc(s.nombre)}:</p><p>Hemos recibido tu solicitud y te llamaremos al ${esc(s.telefono)} para concretar una visita.</p>${lines}<p>Los importes son orientativos y sin IVA; el presupuesto definitivo se confirma tras ver el trabajo.</p><p>${site.name} · ${site.phoneDisplay}</p>`,
    ).catch(() => null);
  }
  return res.ok;
}

import "server-only";
import { site, siteUrl } from "@/content/site";
import { formatVisit } from "@/lib/agenda/calendar-links";
import type { Lead } from "@/lib/leads/types";
import { zoneLabel } from "@/lib/zones";
import { formatEuros, type Estimate } from "@/lib/pricing/engine";

/** Avisos por email con la API REST de Resend. Las claves solo viven en el servidor. */

export const mailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_TO && process.env.EMAIL_FROM);

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

interface Attachment {
  filename: string;
  content: string;
}

async function send(to: string, subject: string, html: string, opts: { replyTo?: string; attachments?: Attachment[] } = {}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, reply_to: opts.replyTo, attachments: opts.attachments }),
    signal: AbortSignal.timeout(8000),
  });
  return res.ok;
}

const wrap = (body: string) =>
  `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1c1b19;max-width:560px">${body}<p style="color:#5e584e;font-size:13px;margin-top:32px">${site.name} · ${site.phoneDisplay} · <a href="${siteUrl}" style="color:#5e584e">${siteUrl.replace(/^https?:\/\//, "")}</a></p></div>`;

function linesTable(est: Estimate) {
  const rows = est.lines
    .map(
      (l) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e9e3d7">${esc(l.name)}<br><span style="color:#5e584e;font-size:13px">${String(l.qty).replace(".", ",")} × ${formatEuros(l.unitPriceCents)}</span></td><td style="padding:8px 0;border-bottom:1px solid #e9e3d7;text-align:right;white-space:nowrap">${formatEuros(l.totalCents)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}<tr><td style="padding:12px 0"><strong>Precio base</strong></td><td style="padding:12px 0;text-align:right"><strong>${formatEuros(est.baseCents)} + IVA</strong></td></tr></table>`;
}

const who = (l: Lead) => l.nombre ?? l.email ?? l.telefono ?? "Sin nombre";

export async function notifyNewLead(l: Lead, est: Estimate | null, label?: string): Promise<boolean> {
  if (!mailConfigured()) return false;
  const kind = label ?? (l.tipo === "estimacion" ? "Ha calculado su precio" : "Pide presupuesto");
  const html = wrap(`<h2 style="font-weight:normal">${kind}: ${esc(who(l))}</h2>
<p>${l.telefono ? `Tel.: <a href="tel:${esc(l.telefono)}">${esc(l.telefono)}</a><br>` : ""}${l.email ? `Email: ${esc(l.email)}<br>` : ""}CP: ${esc(l.codigo_postal)} · ${esc(zoneLabel(l.zona))}</p>
${l.servicios.length ? `<p>Trabajos: ${l.servicios.map(esc).join(", ")}</p>` : ""}
${l.mensaje ? `<p style="white-space:pre-line">${esc(l.mensaje)}</p>` : ""}${est ? linesTable(est) : ""}
<p><a href="${siteUrl}/panel">Abrir el panel</a></p>`);
  return send(process.env.NOTIFY_EMAIL_TO!, `${kind}: ${who(l)} (${l.codigo_postal})`, html, { replyTo: l.email ?? undefined });
}

export async function sendEstimateToClient(l: Lead, est: Estimate, bookUrl: string): Promise<boolean> {
  if (!mailConfigured() || !l.email) return false;
  const html = wrap(`<p>Hola${l.nombre ? `, ${esc(l.nombre)}` : ""}:</p>
<p>Aquí tienes el desglose de tu precio orientativo, calculado con nuestras tarifas base.</p>${linesTable(est)}
<p style="color:#5e584e;font-size:13px">Es una estimación, no un presupuesto. El precio definitivo te lo damos por escrito después de ver la obra.</p>
<p><a href="${bookUrl}" style="display:inline-block;background:#1c1b19;color:#f3efe7;padding:12px 22px;border-radius:999px;text-decoration:none">Elegir día para la visita</a></p>
<p>Si prefieres hablarlo, llámanos o escríbenos por WhatsApp al ${site.phoneDisplay}.</p>`);
  return send(l.email, `Tu precio orientativo · ${site.name}`, html, { replyTo: site.email });
}

export async function notifyVisit(l: Lead, start: Date, ics: string): Promise<boolean> {
  if (!mailConfigured()) return false;
  const when = formatVisit(start);
  const att = [{ filename: "visita-souto.ics", content: Buffer.from(ics).toString("base64") }];
  const company = wrap(`<h2 style="font-weight:normal">Visita reservada: ${esc(when)}</h2>
<p><strong>${esc(who(l))}</strong><br>${l.telefono ? `Tel.: <a href="tel:${esc(l.telefono)}">${esc(l.telefono)}</a><br>` : ""}${l.email ? `Email: ${esc(l.email)}<br>` : ""}
${l.visita_direccion ? `Dirección: ${esc(l.visita_direccion)}<br>` : ""}CP: ${esc(l.codigo_postal)} · ${esc(zoneLabel(l.zona))}</p>
${l.servicios.length ? `<p>Trabajos: ${l.servicios.map(esc).join(", ")}</p>` : ""}
${l.estimacion_base_cents != null ? `<p>Estimación base: ${formatEuros(l.estimacion_base_cents)} + IVA</p>` : ""}
<p><a href="${siteUrl}/panel">Abrir el panel</a></p>`);
  const ok = await send(process.env.NOTIFY_EMAIL_TO!, `Visita ${when} · ${who(l)} (${zoneLabel(l.zona)})`, company, {
    replyTo: l.email ?? undefined,
    attachments: att,
  });
  if (l.email) {
    await send(
      l.email,
      `Visita confirmada: ${when} · ${site.name}`,
      wrap(`<p>Hola${l.nombre ? `, ${esc(l.nombre)}` : ""}:</p>
<p>Te esperamos el <strong>${esc(when)}</strong>. Te llamaremos antes para confirmar la dirección y cualquier detalle.</p>
<p>Si necesitas cambiar la hora, llámanos o escríbenos por WhatsApp al ${site.phoneDisplay}.</p>`),
      { replyTo: site.email, attachments: att },
    ).catch(() => false);
  }
  return ok;
}

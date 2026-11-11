import { estadoLabel } from "@/lib/leads/types";
import { hasPanelAccess } from "@/lib/server/panel-auth";
import { listLeads } from "@/lib/server/store";
import { zoneLabel } from "@/lib/zones";

export const runtime = "nodejs";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Evita fórmulas al abrir el CSV en Excel.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const euros = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

export async function GET() {
  if (!(await hasPanelAccess())) return new Response("No autorizado", { status: 401 });
  const leads = await listLeads(5000);
  const head = ["Fecha", "Nombre", "Teléfono", "Email", "CP", "Zona", "Trabajos", "Estimación web (€)", "Presupuesto (€)", "Estado", "Visita", "Dirección", "Mensaje", "Notas"];
  const rows = leads.map((l) =>
    [
      new Date(l.created_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }),
      l.nombre, l.telefono, l.email, l.codigo_postal, zoneLabel(l.zona), l.servicios.join(", "),
      euros(l.estimacion_base_cents), euros(l.presupuesto_importe_cents), estadoLabel[l.estado],
      l.visita_at ? new Date(l.visita_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }) : "",
      l.visita_direccion, l.mensaje, l.notas,
    ].map(cell).join(";"),
  );
  const csv = "﻿" + [head.map(cell).join(";"), ...rows].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="solicitudes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { site } from "@/content/site";
import { ESTADOS, estadoLabel, isDemoLead, isEmailOnly, isOpen, type Estado, type Lead } from "@/lib/leads/types";
import { formatEuros } from "@/lib/pricing/engine";
import { zoneDir, zoneDirLabel, zoneDirs, zoneLabel } from "@/lib/zones";
import { HBars, WeeklyBars } from "./charts";
import { fmtDate, LeadDrawer, mailHref, serviceNames, waText, ZoneTag } from "./LeadDrawer";
import { byZone, dayKey, funnel, kpis, leadValue, todos, valueByKind, waNumber, weekly, zoneColor } from "./metrics";

type Tab = "resumen" | "solicitudes" | "agenda";

const estadoStyle: Record<Estado, string> = {
  nueva: "bg-grafito text-cal",
  contactada: "bg-lino text-grafito",
  visita: "bg-[#e6eef8] text-[#1d4f8c]",
  presupuesto_enviado: "bg-[#f6ead2] text-[#6b4b07]",
  ganada: "bg-[#dcefe3] text-[#1c5a33]",
  perdida: "bg-transparent text-gris line-through decoration-gris/50",
};

function Estado({ e }: { e: Estado }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyle[e]}`}>{estadoLabel[e]}</span>;
}

function Card({ title, children, className = "", aside }: { title: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={`border border-piedra bg-white/60 p-5 md:p-6 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[0.95rem] font-medium">{title}</h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Kpi({ label, value, sub, onClick }: { label: string; value: string; sub?: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="text-sm text-gris">{label}</span>
      <span className="display mt-3 block text-[2.8rem] leading-none tabular-nums">{value}</span>
      {sub && <span className="mt-2 block text-xs text-gris">{sub}</span>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="border border-piedra bg-white/60 p-5 text-left transition-colors hover:border-grafito md:p-6">{inner}</button>
  ) : (
    <div className="border border-piedra bg-white/60 p-5 md:p-6">{inner}</div>
  );
}

export function PanelApp({
  initial, nowIso, canWrite, gcal, mail, db, openId,
}: {
  initial: Lead[];
  nowIso: string;
  canWrite: boolean;
  gcal: boolean;
  mail: boolean;
  db: boolean;
  openId?: string;
}) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [leads, setLeads] = useState(initial);
  const [tab, setTab] = useState<Tab>("resumen");
  const [openLead, setOpenLead] = useState<string | null>(openId ?? null);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"abiertas" | "todas" | Estado | "solo-email">("abiertas");
  const [zona, setZona] = useState<string>("todas");

  const demo = leads.some(isDemoLead);
  const k = useMemo(() => kpis(leads, now), [leads, now]);
  const todo = useMemo(() => todos(leads, now), [leads, now]);
  const current = leads.find((l) => l.id === openLead) ?? null;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (openLead) url.searchParams.set("s", openLead);
    else url.searchParams.delete("s");
    window.history.replaceState(null, "", url);
  }, [openLead]);

  const update = useCallback((l: Lead) => setLeads((ls) => ls.map((x) => (x.id === l.id ? l : x))), []);
  const remove = useCallback((id: string) => {
    setLeads((ls) => ls.filter((x) => x.id !== id));
    setOpenLead(null);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (estado === "abiertas" && !isOpen(l)) return false;
      if (estado === "solo-email" && !(isEmailOnly(l) && isOpen(l))) return false;
      if (ESTADOS.includes(estado as Estado) && l.estado !== estado) return false;
      if (zona !== "todas" && zoneDir(l.zona) !== zona) return false;
      if (!term) return true;
      return [l.nombre, l.telefono, l.email, l.codigo_postal, l.mensaje, serviceNames(l), zoneLabel(l.zona)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [leads, q, estado, zona]);

  // Agenda: próximas visitas agrupadas por día.
  const agenda = useMemo(() => {
    const upcoming = leads
      .filter((l) => l.visita_at && isOpen(l) && new Date(l.visita_at).getTime() >= now.getTime() - 3_600_000)
      .sort((a, b) => a.visita_at!.localeCompare(b.visita_at!));
    const days = new Map<string, Lead[]>();
    for (const l of upcoming) {
      const d = dayKey(l.visita_at!);
      days.set(d, [...(days.get(d) ?? []), l]);
    }
    return [...days.entries()].slice(0, 15);
  }, [leads, now]);

  // Solicitudes sin visita que podrían ir un día que ya estás en su zona.
  const routeTips = useMemo(() => {
    const visitDaysByZone = new Map<string, Set<string>>();
    for (const [day, ls] of agenda) for (const l of ls) if (l.zona) visitDaysByZone.set(l.zona, (visitDaysByZone.get(l.zona) ?? new Set()).add(day));
    return leads
      .filter((l) => isOpen(l) && !l.visita_at && l.telefono && l.zona && visitDaysByZone.has(l.zona))
      .map((l) => ({ lead: l, days: [...visitDaysByZone.get(l.zona!)!].sort() }));
  }, [agenda, leads]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "solicitudes", label: "Solicitudes", count: leads.filter(isOpen).length },
    { id: "agenda", label: "Agenda", count: agenda.reduce((s, [, l]) => s + l.length, 0) },
  ];

  const zoneCounts = byZone(leads);
  const kinds = valueByKind(leads);
  const f = funnel(leads, now);

  async function logout() {
    await fetch("/api/panel/login", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-cal">
      <header className="sticky top-0 z-30 border-b border-piedra bg-cal/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <div className="flex items-baseline gap-3">
            <span className="font-sans text-lg font-bold tracking-[0.06em]">SOUTO</span>
            <span className="text-sm text-gris">Panel de solicitudes</span>
          </div>
          <nav className="order-last flex w-full gap-1 md:order-none md:w-auto" aria-label="Secciones del panel">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={tab === t.id ? "page" : undefined}
                onClick={() => setTab(t.id)}
                className={`min-h-10 flex-1 rounded-full px-4 text-sm font-medium transition-colors md:flex-none ${tab === t.id ? "bg-grafito text-cal" : "hover:bg-lino"}`}
              >
                {t.label}{" "}
                {t.count != null && <span className={`ml-1.5 tabular-nums ${tab === t.id ? "text-cal/60" : "text-gris"}`}>{t.count}</span>}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <a href="/api/panel/export" className="text-gris underline underline-offset-4 hover:text-grafito">Descargar Excel</a>
            <Link href="/" className="text-gris underline underline-offset-4 hover:text-grafito">Ver la web</Link>
            <button type="button" onClick={logout} className="text-gris underline underline-offset-4 hover:text-grafito">Salir</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8">
        {demo && (
          <p className="mb-6 bg-[#f6ead2] px-4 py-3 text-sm">
            <strong className="font-medium">Datos de ejemplo.</strong> Las personas de esta lista son inventadas para enseñar cómo funciona el panel.
            {canWrite ? " Desaparecen al conectar la base de datos." : " En este modo los cambios no se guardan."}
          </p>
        )}
        {(!db || !mail || !gcal) && (
          <details className="mb-6 text-sm text-gris">
            <summary className="cursor-pointer">Conexiones pendientes ({[!db && "base de datos", !mail && "email", !gcal && "Google Calendar"].filter(Boolean).join(", ")})</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {!db && <li>Sin base de datos las solicitudes no se guardan. Ver README, paso «Supabase».</li>}
              {!mail && <li>Sin email no os llega el aviso de cada solicitud ni el cliente recibe su precio.</li>}
              {!gcal && <li>Sin Google Calendar, las visitas no aparecen solas en vuestro calendario (cada ficha tiene «Pasar a Google Calendar»).</li>}
            </ul>
          </details>
        )}

        {tab === "resumen" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi
                label="Solicitudes este mes"
                value={String(k.month)}
                sub={k.monthDelta === 0 ? "Igual que el mes pasado a estas alturas" : `${k.monthDelta > 0 ? "+" : ""}${k.monthDelta} respecto al mes pasado a estas alturas`}
                onClick={() => { setEstado("todas"); setTab("solicitudes"); }}
              />
              <Kpi label="Visitas en 7 días" value={String(k.upcoming)} sub="Ver agenda" onClick={() => setTab("agenda")} />
              <Kpi
                label="Solo dejaron su email"
                value={String(k.emailOnly)}
                sub="Calcularon precio sin pedir visita"
                onClick={() => { setEstado("solo-email"); setTab("solicitudes"); }}
              />
              <Kpi label="Obras aceptadas este mes" value={String(k.won)} sub={k.wonCents ? `${formatEuros(k.wonCents)} sin IVA` : undefined} />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
              <Card title="Por hacer" aside={<span className="text-sm text-gris tabular-nums">{todo.length}</span>}>
                {todo.length === 0 ? (
                  <p className="text-sm text-gris">Todo al día.</p>
                ) : (
                  <ul className="-my-2 divide-y divide-piedra">
                    {todo.slice(0, 8).map((t) => {
                      const l = t.lead;
                      const href =
                        t.action === "email" ? mailHref(l) : t.action === "whatsapp" && l.telefono ? `https://wa.me/${waNumber(l.telefono)}?text=${encodeURIComponent(waText(l))}` : l.telefono ? `tel:${l.telefono}` : undefined;
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                          <button type="button" onClick={() => setOpenLead(l.id)} className="min-w-0 text-left">
                            <span className="block truncate font-medium hover:underline">{t.title}</span>
                            <span className="block text-sm text-gris">{t.why}</span>
                          </button>
                          {href && (
                            <a href={href} target={t.action === "whatsapp" ? "_blank" : undefined} rel="noopener" className="btn-ghost shrink-0 !min-h-9 !px-4 text-sm">
                              {t.action === "email" ? "Escribir" : t.action === "whatsapp" ? "WhatsApp" : "Llamar"}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {todo.length > 8 && <p className="mt-3 text-sm text-gris">Y {todo.length - 8} más en Solicitudes.</p>}
              </Card>

              <Card title="Solicitudes por semana">
                <WeeklyBars data={weekly(leads, now)} />
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card title="Del primer clic a la obra" aside={<span className="text-xs text-gris">últimos 90 días</span>}>
                <HBars rows={f.map((s) => ({ label: s.label, value: s.count }))} format={(n) => String(n)} />
                {f[0]!.count > 0 && (
                  <p className="mt-4 text-sm text-gris">
                    {Math.round((f[4]!.count / f[0]!.count) * 100)} % de las solicitudes acaban en obra.
                  </p>
                )}
              </Card>
              <Card title="En juego por tipo de trabajo" aside={<span className="text-xs text-gris">abiertas</span>}>
                <HBars
                  rows={kinds.map((x) => ({ label: x.label, value: x.cents, note: x.unknown ? `· ${x.unknown} sin precio` : undefined }))}
                  format={(n) => (n ? formatEuros(Math.round(n / 100) * 100) : "—")}
                  color="#7c6a32"
                />
                <p className="mt-4 text-xs text-gris">Presupuesto enviado o, si aún no hay, la estimación de la web. Sin IVA.</p>
              </Card>
              <Card title="Por zona" aside={<span className="text-xs text-gris">abiertas</span>}>
                <HBars rows={zoneDirs.filter((d) => zoneCounts.get(d)).map((d) => ({ label: zoneDirLabel[d], value: zoneCounts.get(d)!, color: zoneColor[d] }))} />
              </Card>
            </div>
          </div>
        )}

        {tab === "solicitudes" && (
          <div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-56 flex-1">
                <span className="sr-only">Buscar</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, teléfono, CP…" className="field !min-h-11 bg-transparent" type="search" />
              </label>
              <select value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className="min-h-11 rounded-full border border-piedra bg-cal px-4 text-sm" aria-label="Estado">
                <option value="abiertas">Abiertas</option>
                <option value="solo-email">Solo dejaron su email</option>
                {ESTADOS.map((s) => <option key={s} value={s}>{estadoLabel[s]}</option>)}
                <option value="todas">Todas</option>
              </select>
              <select value={zona} onChange={(e) => setZona(e.target.value)} className="min-h-11 rounded-full border border-piedra bg-cal px-4 text-sm" aria-label="Zona">
                <option value="todas">Todas las zonas</option>
                {zoneDirs.map((d) => <option key={d} value={d}>{zoneDirLabel[d]}</option>)}
              </select>
            </div>
            <p className="mt-4 text-sm text-gris tabular-nums">{filtered.length} {filtered.length === 1 ? "solicitud" : "solicitudes"}</p>

            <div className="mt-3 overflow-x-auto border border-piedra bg-white/60">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="border-b border-piedra text-xs uppercase tracking-[0.12em] text-gris">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Qué quiere</th>
                    <th className="px-4 py-3 font-medium">Zona</th>
                    <th className="px-4 py-3 text-right font-medium">Importe</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Llegó</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-piedra">
                  {filtered.map((l) => {
                    const v = leadValue(l);
                    return (
                      <tr key={l.id} onClick={() => setOpenLead(l.id)} className="cursor-pointer hover:bg-lino/60">
                        <td className="px-4 py-3">
                          <button type="button" className="text-left font-medium hover:underline" onClick={(e) => { e.stopPropagation(); setOpenLead(l.id); }}>
                            {l.nombre ?? l.email ?? "Sin nombre"}
                          </button>
                          <span className="block text-xs text-gris">{l.telefono ?? "Solo email"}</span>
                        </td>
                        <td className="max-w-56 truncate px-4 py-3">{serviceNames(l)}</td>
                        <td className="px-4 py-3"><ZoneTag zona={l.zona} /></td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {v != null ? formatEuros(v) : <span className="text-gris">Con visita</span>}
                          {l.presupuesto_importe_cents == null && v != null && <span className="block text-xs text-gris">estimado</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Estado e={l.estado} />
                          {l.visita_at && l.estado === "visita" && <span className="block pt-1 text-xs text-gris">{fmtDate(l.visita_at, { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gris">{fmtDate(l.created_at, { day: "numeric", month: "short" })}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gris">No hay solicitudes con estos filtros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "agenda" && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card
              title="Próximas visitas"
              aside={gcal ? <span className="text-xs text-gris">Sincronizado con Google Calendar</span> : <span className="text-xs text-gris">Google Calendar sin conectar</span>}
            >
              {agenda.length === 0 ? (
                <p className="text-sm text-gris">No hay visitas agendadas.</p>
              ) : (
                <ol className="space-y-6">
                  {agenda.map(([day, ls]) => {
                    const zones = [...new Set(ls.map((l) => zoneLabel(l.zona)))];
                    return (
                      <li key={day}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-piedra pb-2">
                          <h3 className="display text-[1.6rem] first-letter:uppercase">{fmtDate(`${day}T12:00:00Z`, { weekday: "long", day: "numeric", month: "long" })}</h3>
                          <span className="text-xs text-gris">{ls.length} {ls.length === 1 ? "visita" : "visitas"} · {zones.join(", ")}</span>
                        </div>
                        <ul className="divide-y divide-piedra/60">
                          {ls.map((l) => (
                            <li key={l.id}>
                              <button type="button" onClick={() => setOpenLead(l.id)} className="grid w-full grid-cols-[3.5rem_1fr] gap-3 py-3 text-left hover:bg-lino/50">
                                <span className="font-medium tabular-nums">{fmtDate(l.visita_at!, { hour: "2-digit", minute: "2-digit" })}</span>
                                <span>
                                  <span className="font-medium">{l.nombre ?? "Cliente"}</span> · <ZoneTag zona={l.zona} />
                                  <span className="block text-sm text-gris">{[l.visita_direccion, serviceNames(l)].filter(Boolean).join(" · ")}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>

            <div className="space-y-6">
              <Card title="Aprovecha el viaje">
                {routeTips.length === 0 ? (
                  <p className="text-sm text-gris">Cuando haya solicitudes sin visita en una zona donde ya vais un día, aparecerán aquí para agruparlas.</p>
                ) : (
                  <ul className="-my-2 divide-y divide-piedra">
                    {routeTips.slice(0, 8).map(({ lead: l, days }) => (
                      <li key={l.id} className="py-3">
                        <button type="button" onClick={() => setOpenLead(l.id)} className="text-left">
                          <span className="font-medium hover:underline">{l.nombre}</span> · <ZoneTag zona={l.zona} />
                          <span className="block text-sm text-gris">
                            Ya vais por allí el {days.map((d) => fmtDate(`${d}T12:00:00Z`, { weekday: "long", day: "numeric" })).join(" y el ")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Colores de zona">
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {zoneDirs.map((d) => (
                    <li key={d} className="flex items-center gap-2">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: zoneColor[d] }} />
                      {zoneDirLabel[d]}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-gris">
                  La zona sale del código postal. En Google Calendar cada visita lleva un color parecido según la zona.
                </p>
              </Card>
              <p className="text-xs text-gris">
                Los clientes reservan solos en la web en los huecos libres (lunes a viernes). Para cambiar el horario que se ofrece, hay que
                editar <code>src/content/agenda.ts</code>. Teléfono de la web: {site.phoneDisplay}.
              </p>
            </div>
          </div>
        )}
      </main>

      {current && (
        <LeadDrawer
          lead={current}
          leads={leads}
          now={now}
          canWrite={canWrite}
          gcal={gcal}
          onChange={update}
          onDelete={remove}
          onClose={() => setOpenLead(null)}
        />
      )}
    </div>
  );
}

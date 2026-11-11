import type { Metadata } from "next";
import { Login } from "@/components/panel/Login";
import { PanelApp } from "@/components/panel/PanelApp";
import { gcalConfigured } from "@/lib/server/gcal";
import { mailConfigured } from "@/lib/server/mail";
import { devPasswordHint, hasPanelAccess, panelAccess } from "@/lib/server/panel-auth";
import { canWrite, dbConfigured, listLeads } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  if (panelAccess() === "disabled") {
    return (
      <main className="grid min-h-screen place-items-center bg-cal px-5">
        <div className="max-w-md">
          <h1 className="display text-[2.6rem]">Panel sin configurar</h1>
          <p className="mt-4 leading-relaxed text-gris">Falta la variable PANEL_PASSWORD en el servidor. Mira el README, apartado «Puesta en marcha».</p>
        </div>
      </main>
    );
  }
  if (!(await hasPanelAccess())) return <Login hint={devPasswordHint()} />;

  let leads = [] as Awaited<ReturnType<typeof listLeads>>;
  let loadError = false;
  try {
    leads = await listLeads();
  } catch (e) {
    console.error("[panel] No se pudieron cargar las solicitudes", e);
    loadError = true;
  }
  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-cal px-5">
        <p className="max-w-md text-gris">No se han podido cargar las solicitudes. Recarga en un momento; si sigue, revisa la conexión con Supabase.</p>
      </main>
    );
  }
  return (
    <PanelApp
      initial={leads}
      nowIso={new Date().toISOString()}
      canWrite={canWrite()}
      gcal={gcalConfigured()}
      mail={mailConfigured()}
      db={dbConfigured()}
      openId={(await searchParams).s}
    />
  );
}

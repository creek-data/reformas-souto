"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { site, whatsappUrl } from "@/content/site";
import type { SolicitudInput } from "@/lib/validation/solicitud";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void }) => void };
  }
}

type Extra = Pick<SolicitudInput, "tipo" | "servicios" | "lineas" | "contexto">;
export type SubmitState = { status: "idle" | "sending" | "sent" | "error"; message?: string; errors?: Record<string, string> };

/**
 * Campos de contacto + envío a /api/solicitudes. Lo comparten el formulario y
 * la calculadora. Incluye trampa para bots, tiempo mínimo y Turnstile opcional.
 */
export function LeadFields({ extra, submitLabel, dark = false }: { extra: Extra; submitLabel: string; dark?: boolean }) {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const startedAt = useRef(Date.now());
  const token = useRef<string | undefined>(undefined);
  const widget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_KEY || !widget.current) return;
    const render = () => window.turnstile?.render(widget.current!, { sitekey: TURNSTILE_KEY, callback: (t) => (token.current = t) });
    if (window.turnstile) return render();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.onload = render;
    document.head.appendChild(s);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: SolicitudInput = {
      ...extra,
      nombre: String(f.get("nombre") ?? ""),
      telefono: String(f.get("telefono") ?? ""),
      email: String(f.get("email") ?? ""),
      codigoPostal: String(f.get("codigoPostal") ?? ""),
      mensaje: String(f.get("mensaje") ?? "") || undefined,
      consentimiento: f.get("consentimiento") === "on" ? true : (false as unknown as true),
      website: String(f.get("website") ?? ""),
      startedAt: startedAt.current,
      turnstileToken: token.current,
    };
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: Record<string, string> };
      if (res.ok && data.ok) return setState({ status: "sent" });
      setState({ status: "error", message: data.error ?? "Revisa los campos marcados.", errors: data.errors });
    } catch {
      setState({ status: "error", message: "No hay conexión. Llámanos o escríbenos por WhatsApp." });
    }
  }

  if (state.status === "sent") {
    return (
      <div role="status" className="py-6">
        <p className="display text-[2.4rem] md:text-[3rem]">Gracias. <em>Te llamamos pronto.</em></p>
        <p className={`mt-4 max-w-md leading-relaxed ${dark ? "text-cal/70" : "text-gris"}`}>
          Hemos recibido tu solicitud. Si es urgente, llámanos al{" "}
          <a href={`tel:${site.phone}`} className="underline underline-offset-4">{site.phoneDisplay}</a>.
        </p>
      </div>
    );
  }

  const err = state.errors ?? {};
  const field = (name: string) => ({
    name,
    id: `f-${name}`,
    "aria-invalid": err[name] ? true : undefined,
    "aria-describedby": err[name] ? `e-${name}` : undefined,
    className: `field ${dark ? "!border-cal/30 !text-cal focus:!border-cal" : ""}`,
  });
  const Label = ({ name, children }: { name: string; children: React.ReactNode }) => (
    <label htmlFor={`f-${name}`} className={`label ${dark ? "!text-cal/60" : ""}`}>{children}</label>
  );
  const Err = ({ name }: { name: string }) =>
    err[name] ? <p id={`e-${name}`} className="mt-2 text-sm text-[#b4402f]">{err[name]}</p> : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
      <div>
        <Label name="nombre">Nombre</Label>
        <input {...field("nombre")} type="text" autoComplete="name" required />
        <Err name="nombre" />
      </div>
      <div>
        <Label name="telefono">Teléfono</Label>
        <input {...field("telefono")} type="tel" autoComplete="tel" inputMode="tel" required />
        <Err name="telefono" />
      </div>
      <div>
        <Label name="codigoPostal">Código postal de la obra</Label>
        <input {...field("codigoPostal")} type="text" inputMode="numeric" autoComplete="postal-code" maxLength={5} required />
        <Err name="codigoPostal" />
      </div>
      <div>
        <Label name="email">Email (opcional)</Label>
        <input {...field("email")} type="email" autoComplete="email" />
        <Err name="email" />
      </div>
      <div className="sm:col-span-2">
        <Label name="mensaje">Cuéntanos (opcional)</Label>
        <textarea {...field("mensaje")} rows={3} maxLength={2000} />
      </div>
      {/* Trampa para bots: invisible para personas */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="f-website">No rellenar</label>
        <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="sm:col-span-2">
        <label className={`flex items-start gap-3 text-sm leading-relaxed ${dark ? "text-cal/75" : "text-gris"}`}>
          <input name="consentimiento" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#1c1b19]" aria-invalid={err.consentimiento ? true : undefined} />
          <span>
            {site.legalName} tratará tus datos para responder a tu solicitud y preparar tu presupuesto. Puedes ejercer tus derechos
            escribiendo a {site.email}. Más información en la{" "}
            <Link href="/legal/privacidad" className="underline underline-offset-4">política de privacidad</Link>.
          </span>
        </label>
        <Err name="consentimiento" />
      </div>
      {TURNSTILE_KEY && <div ref={widget} className="sm:col-span-2" />}
      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button type="submit" disabled={state.status === "sending"} className={`btn-solid disabled:opacity-60 ${dark ? "!bg-cal !text-grafito" : ""}`}>
          {state.status === "sending" ? "Enviando…" : submitLabel}
        </button>
        <a href={whatsappUrl()} rel="noopener" className={`text-sm underline underline-offset-4 ${dark ? "text-cal/75" : "text-gris"}`}>
          o escríbenos por WhatsApp
        </a>
      </div>
      <p role="alert" className="text-sm text-[#b4402f] sm:col-span-2 empty:hidden">
        {state.status === "error" ? state.message : ""}
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { site } from "@/content/site";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void }) => void };
  }
}

export type Errors = Record<string, string>;

/** Respuesta JSON de nuestras APIs, sin lanzar si el servidor falla. */
export async function postJson<T>(url: string, body: unknown): Promise<{ status: number; data: T & { ok?: boolean; error?: string; errors?: Errors } }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { ok: false, error: "No hay conexión. Llámanos o escríbenos por WhatsApp." } as never };
  }
}

/** Tiempo mínimo, trampa para bots y Turnstile opcional, compartidos por los formularios. */
export function useAntiSpam() {
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
  return {
    fields: (f: FormData) => ({
      website: String(f.get("website") ?? ""),
      startedAt: startedAt.current,
      turnstileToken: token.current,
      consentimiento: f.get("consentimiento") === "on",
    }),
    /** Pintar `{turnstile && <div ref={widgetRef} />}` dentro del formulario. */
    widgetRef: widget,
    turnstile: Boolean(TURNSTILE_KEY),
  };
}

export function Field({
  name, label, error, hint, className = "", dark = false, ...input
}: { name: string; label: string; error?: string; hint?: string; dark?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className={`label ${dark ? "!text-cal/60" : ""}`}>{label}</label>
      <input
        id={`f-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `e-${name}` : hint ? `h-${name}` : undefined}
        className={`field ${dark ? "!border-cal/30 !text-cal focus:!border-cal" : ""}`}
        {...input}
      />
      {hint && !error && <p id={`h-${name}`} className={`mt-2 text-sm ${dark ? "text-cal/55" : "text-gris"}`}>{hint}</p>}
      {error && <p id={`e-${name}`} className="mt-2 text-sm text-[#a33a2a]">{error}</p>}
    </div>
  );
}

export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="f-website">No rellenar</label>
      <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function Consent({ error, purpose, dark = false }: { error?: string; purpose: string; dark?: boolean }) {
  return (
    <div className="sm:col-span-2">
      <label className={`flex items-start gap-3 text-sm leading-relaxed ${dark ? "text-cal/75" : "text-gris"}`}>
        <input name="consentimiento" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#1c1b19]" aria-invalid={error ? true : undefined} />
        <span>
          Acepto que {site.legalName} use estos datos para {purpose}. Nada de publicidad.{" "}
          <Link href="/legal/privacidad" className="underline underline-offset-4">Privacidad</Link>.
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-[#a33a2a]">{error}</p>}
    </div>
  );
}

export function FormAlert({ message }: { message?: string }) {
  return (
    <p role="alert" className="text-sm text-[#a33a2a] sm:col-span-2 empty:hidden">
      {message ?? ""}
    </p>
  );
}

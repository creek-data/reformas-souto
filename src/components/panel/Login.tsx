"use client";

import { useState } from "react";

export function Login({ hint }: { hint: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await fetch("/api/panel/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (res.ok) return window.location.reload();
    setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "No se ha podido entrar");
  }
  return (
    <main className="grid min-h-screen place-items-center bg-cal px-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <p className="font-sans text-lg font-bold tracking-[0.06em]">SOUTO</p>
        <h1 className="display mt-6 text-[2.8rem]">Panel de solicitudes</h1>
        <label className="mt-10 block">
          <span className="label">Contraseña</span>
          <input name="password" type="password" autoComplete="current-password" required autoFocus className="field" aria-invalid={error ? true : undefined} />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-[#a33a2a]">{error}</p>}
        {hint && <p className="mt-3 text-sm text-gris">En local la contraseña es <code>{hint}</code>.</p>}
        <button type="submit" disabled={busy} className="btn-solid mt-8 w-full disabled:opacity-60">{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}

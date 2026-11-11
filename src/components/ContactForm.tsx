"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { Arrow } from "./blocks";
import { Booking } from "./Booking";
import { Consent, Field, FormAlert, Honeypot, postJson, useAntiSpam, type Errors } from "./forms";

export type CreatedLead = { id: string; token: string } | null;

/**
 * Datos de contacto para una solicitud sin precio (contacto general o trabajos
 * que necesitan visita). Al enviarse, ofrece reservar la visita en el momento.
 */
export function ContactForm({
  servicios,
  detalles,
  mensaje,
  submitLabel = "Enviar",
  messageLabel = "¿Qué necesitas? (opcional)",
  askMessage = true,
}: {
  servicios?: string[];
  detalles?: string[];
  /** Texto ya escrito en un paso anterior (calculadora). */
  mensaje?: string;
  submitLabel?: string;
  messageLabel?: string;
  askMessage?: boolean;
}) {
  const spam = useAntiSpam();
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string>();
  const [created, setCreated] = useState<CreatedLead | undefined>(undefined);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSending(true);
    setMessage(undefined);
    const { data } = await postJson<{ lead: CreatedLead }>("/api/solicitudes", {
      tipo: "contacto",
      nombre: String(f.get("nombre") ?? ""),
      telefono: String(f.get("telefono") ?? ""),
      email: String(f.get("email") ?? ""),
      codigoPostal: String(f.get("codigoPostal") ?? ""),
      mensaje: [mensaje, String(f.get("mensaje") ?? "")].filter(Boolean).join("\n") || undefined,
      servicios,
      detalles,
      ...spam.fields(f),
    });
    setSending(false);
    if (data.ok) return setCreated(data.lead ?? null);
    setErrors(data.errors ?? {});
    setMessage(data.error ?? "Revisa los campos marcados.");
  }

  if (created !== undefined) {
    return (
      <div>
        <div role="status" className="border-b border-piedra pb-10">
          <p className="display text-[2.4rem] md:text-[3rem]">Recibido. <em>Gracias.</em></p>
          <p className="mt-4 max-w-md leading-relaxed text-gris">
            {created
              ? "Ya tenemos tus datos. Si quieres, deja ya la visita reservada y te ahorras la llamada."
              : `Te llamamos pronto. Si es urgente, llámanos al ${site.phoneDisplay}.`}
          </p>
        </div>
        {created && (
          <div className="pt-10">
            <h3 className="display text-[2rem] md:text-[2.6rem]">Elige día para la visita</h3>
            <div className="mt-6">
              <Booking l={created.id} t={created.token} intro={false} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-x-8 gap-y-7 sm:grid-cols-2">
      <Field name="nombre" label="Nombre" autoComplete="name" error={errors.nombre} required />
      <Field name="telefono" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" error={errors.telefono} required />
      <Field
        name="codigoPostal"
        label="Código postal de la obra"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        error={errors.codigoPostal}
        hint="Para saber la zona y agrupar visitas."
        required
      />
      <Field name="email" label="Email (opcional)" type="email" autoComplete="email" error={errors.email} />
      {askMessage && (
        <div className="sm:col-span-2">
          <label htmlFor="f-mensaje" className="label">{messageLabel}</label>
          <textarea id="f-mensaje" name="mensaje" rows={3} maxLength={2000} className="field" placeholder="Por ejemplo: pintar un piso de 3 habitaciones con gotelé" />
        </div>
      )}
      <Honeypot />
      <Consent error={errors.consentimiento} purpose="responderte y preparar tu presupuesto" />
      {spam.turnstile && <div ref={spam.widgetRef} className="sm:col-span-2" />}
      <FormAlert message={message} />
      <div className="sm:col-span-2">
        <button type="submit" disabled={sending} className="btn-solid disabled:opacity-60">
          {sending ? "Enviando…" : submitLabel} {!sending && <Arrow />}
        </button>
      </div>
    </form>
  );
}

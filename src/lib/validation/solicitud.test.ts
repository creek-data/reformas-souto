import { describe, expect, it } from "vitest";
import { solicitudSchema } from "./solicitud";

const base = {
  tipo: "contacto" as const,
  nombre: "Ana García",
  telefono: "691 56 74 30",
  codigoPostal: "28019",
  consentimiento: true as const,
  startedAt: Date.now(),
};

describe("solicitudSchema", () => {
  it("acepta una solicitud mínima y normaliza el teléfono", () => {
    const r = solicitudSchema.parse(base);
    expect(r.telefono).toBe("691567430");
    expect(r.email).toBeUndefined();
  });

  it("acepta prefijo internacional", () => {
    expect(solicitudSchema.parse({ ...base, telefono: "+34 691 567 430" }).telefono).toBe("+34691567430");
  });

  it("exige consentimiento", () => {
    expect(solicitudSchema.safeParse({ ...base, consentimiento: false }).success).toBe(false);
  });

  it("rechaza teléfono, código postal y email no válidos", () => {
    expect(solicitudSchema.safeParse({ ...base, telefono: "123" }).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...base, codigoPostal: "2801" }).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...base, email: "no-es-email" }).success).toBe(false);
  });

  it("acepta email vacío como ausente", () => {
    expect(solicitudSchema.parse({ ...base, email: "" }).email).toBeUndefined();
  });

  it("rechaza la trampa para bots rellena", () => {
    expect(solicitudSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
  });

  it("limita las partidas", () => {
    const lineas = Array.from({ length: 21 }, (_, i) => ({ code: `x${i}`, qty: 1 }));
    expect(solicitudSchema.safeParse({ ...base, tipo: "calculadora", lineas }).success).toBe(false);
  });
});

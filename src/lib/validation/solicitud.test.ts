import { describe, expect, it } from "vitest";
import { contactoSchema, reservaSchema, solicitudSchema } from "./solicitud";

const contacto = {
  tipo: "contacto" as const,
  nombre: "Ana García",
  telefono: "691 56 74 30",
  codigoPostal: "28019",
  consentimiento: true as const,
  startedAt: Date.now(),
};

const estimacion = {
  tipo: "estimacion" as const,
  email: "Ana@Correo.es ",
  codigoPostal: "28019",
  lineas: [{ code: "pintura-liso", qty: 40 }],
  consentimiento: true as const,
  startedAt: Date.now(),
};

describe("contacto", () => {
  it("acepta lo mínimo y normaliza el teléfono", () => {
    const r = contactoSchema.parse(contacto);
    expect(r.telefono).toBe("691567430");
    expect(r.email).toBeUndefined();
  });
  it("acepta prefijo internacional", () => {
    expect(contactoSchema.parse({ ...contacto, telefono: "+34 691 567 430" }).telefono).toBe("+34691567430");
  });
  it("rechaza teléfono y CP inválidos", () => {
    expect(solicitudSchema.safeParse({ ...contacto, telefono: "123" }).success).toBe(false);
    expect(solicitudSchema.safeParse({ ...contacto, codigoPostal: "99000" }).success).toBe(false);
  });
  it("exige consentimiento", () => {
    expect(solicitudSchema.safeParse({ ...contacto, consentimiento: false }).success).toBe(false);
  });
});

describe("estimacion (calculadora)", () => {
  it("exige email y lo normaliza", () => {
    const r = solicitudSchema.parse(estimacion);
    expect(r.tipo === "estimacion" && r.email).toBe("ana@correo.es");
    expect(solicitudSchema.safeParse({ ...estimacion, email: "" }).success).toBe(false);
  });
  it("no necesita teléfono pero sí alguna medida", () => {
    expect(solicitudSchema.safeParse({ ...estimacion, lineas: [] }).success).toBe(false);
  });
  it("rechaza cantidades fuera de rango", () => {
    expect(solicitudSchema.safeParse({ ...estimacion, lineas: [{ code: "pintura-liso", qty: 10_000 }] }).success).toBe(false);
  });
});

describe("reserva", () => {
  const base = { l: "8c5b1d2e-1111-4a2b-9c3d-123456789abc", t: "token-de-prueba", nombre: "Ana", telefono: "691567430" };
  it("una visita exige dirección", () => {
    expect(reservaSchema.safeParse({ ...base, start: "2026-11-20T09:00:00.000Z" }).success).toBe(false);
    expect(reservaSchema.safeParse({ ...base, start: "2026-11-20T09:00:00.000Z", direccion: "Calle Mayor 3, 2ºB" }).success).toBe(true);
  });
  it("pedir llamada no necesita hora ni dirección", () => {
    expect(reservaSchema.safeParse(base).success).toBe(true);
  });
});

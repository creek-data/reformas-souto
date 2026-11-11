import { describe, expect, it } from "vitest";
import { EstimateError, estimate, formatEuros, roomAreas } from "./engine";

describe("estimate", () => {
  it("suma partidas con precios del catálogo validado", () => {
    // Ejemplo del plan: 60 m² de alisado (900 €) + 2 puertas (180 €) = 1.080 €
    const e = estimate([
      { code: "alisado-gotele", qty: 60 },
      { code: "esmaltado-puertas", qty: 2 },
    ]);
    expect(e.baseCents).toBe(108000);
    expect(e.lines.map((l) => l.totalCents)).toEqual([90000, 18000]);
    expect(e.rangeCents).toBeNull();
  });

  it("calcula céntimos sin errores de coma flotante", () => {
    const e = estimate([{ code: "pintura-liso", qty: 33.3 }]);
    expect(e.baseCents).toBe(22311); // 33,3 × 6,70 € = 223,11 €
  });

  it("redondea unidades enteras", () => {
    expect(estimate([{ code: "esmaltado-puertas", qty: 2.6 }]).lines[0]?.qty).toBe(3);
  });

  it("rechaza partidas inventadas, repetidas o cantidades no válidas", () => {
    expect(() => estimate([{ code: "fontaneria", qty: 1 }])).toThrow(EstimateError);
    expect(() => estimate([{ code: "pintura-liso", qty: 0 }])).toThrow(EstimateError);
    expect(() => estimate([{ code: "pintura-liso", qty: 99999 }])).toThrow(EstimateError);
    expect(() => estimate([{ code: "pintura-liso", qty: Number.NaN }])).toThrow(EstimateError);
    expect(() =>
      estimate([
        { code: "pintura-liso", qty: 1 },
        { code: "pintura-liso", qty: 2 },
      ]),
    ).toThrow(EstimateError);
    expect(() => estimate([])).toThrow(EstimateError);
  });

  it("no inventa recargos: los factores sin validar se informan como pendientes", () => {
    const e = estimate([{ code: "pintura-liso", qty: 10 }], { location: "fuera", condition: "no-se" });
    expect(e.baseCents).toBe(6700);
    expect(e.pendingFactors).toHaveLength(2);
  });

  it("aplica ajustes solo cuando se configuran", () => {
    const e = estimate([{ code: "pintura-liso", qty: 10 }], { location: "fuera", condition: "desperfectos" }, {
      rangeLowPct: 10,
      rangeHighPct: 20,
      minimumCents: 10000,
      travelFeeCents: 3000,
      conditionFactor: { desperfectos: 1.5 },
    });
    // 10 × 10,05 € = 100,50 € + 30 € = 130,50 €
    expect(e.baseCents).toBe(13050);
    expect(e.rangeCents).toEqual({ low: 11745, high: 15660 });
    expect(e.pendingFactors).toEqual([]);
  });
});

describe("roomAreas", () => {
  it("calcula paredes y techo de una habitación", () => {
    expect(roomAreas(4, 3, 2.5)).toEqual({ walls: 35, ceiling: 12 });
  });
  it("rechaza medidas imposibles", () => {
    expect(roomAreas(0, 3, 2.5)).toBeNull();
    expect(roomAreas(4, 3, 500)).toBeNull();
  });
});

describe("formatEuros", () => {
  it("formatea en español", () => {
    expect(formatEuros(108000).replace(/\s/g, " ")).toBe("1.080 €");
    expect(formatEuros(670).replace(/\s/g, " ")).toBe("6,70 €");
  });
});

"use client";

import Link from "next/link";
import { useState } from "react";
import type { FinishKind } from "@/content/services";
import { Finish } from "./Finish";

interface Sample {
  kind: FinishKind;
  name: string;
  href: string;
}

const samples: Sample[] = [
  { kind: "alisado", name: "Alisado", href: "/servicios/alisado-de-gotele" },
  { kind: "gotele", name: "Gotelé", href: "/servicios/pintura" },
  { kind: "microcemento", name: "Microcemento", href: "/servicios/microcemento" },
  { kind: "epoxi", name: "Epoxi", href: "/servicios/suelos-epoxi" },
  { kind: "lacado", name: "Lacado", href: "/servicios/lacados-y-esmaltes" },
  { kind: "papel", name: "Papel pintado", href: "/servicios/papel-pintado" },
];

/** Muestrario interactivo: cada cambio repite la «pasada de rodillo». */
export function FinishSampler({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(2);
  const s = samples[active]!;

  return (
    <figure className="m-0">
      <div className={`relative overflow-hidden rounded-[2px] bg-lino ${compact ? "aspect-[4/5]" : "aspect-[4/3] sm:aspect-[4/5] md:aspect-[5/6]"}`}>
        <div key={s.kind} className="roll absolute inset-0">
          <Finish kind={s.kind} />
        </div>
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
          <span className={`display text-4xl md:text-5xl ${s.kind === "epoxi" ? "text-cal" : "text-grafito"}`}>{s.name}</span>
        </figcaption>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Elegir acabado">
        {samples.map((x, i) => (
          <button
            key={x.kind}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
              i === active ? "border-grafito bg-grafito text-cal" : "border-piedra text-grafito hover:border-grafito"
            }`}
          >
            {x.name}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm">
        <Link href={s.href} className="text-grafito underline underline-offset-4">
          Ver {s.name.toLowerCase()}
        </Link>
      </p>
    </figure>
  );
}

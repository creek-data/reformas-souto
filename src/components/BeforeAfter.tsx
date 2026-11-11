"use client";

import { useState } from "react";
import { beforeAfter, type BeforeAfterPair } from "@/content/pending";
import { features } from "@/content/site";

/** Comparador antes/después accesible (deslizador nativo). Oculto sin fotos reales. */
function Pair({ p }: { p: BeforeAfterPair }) {
  const [pos, setPos] = useState(50);
  return (
    <figure className="m-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-lino">
        <img src={p.after} alt={`Después: ${p.alt}`} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={p.before} alt={`Antes: ${p.alt}`} className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div aria-hidden className="absolute inset-y-0 w-px bg-cal" style={{ left: `${pos}%` }} />
        <span className="label absolute left-4 top-4 rounded-full bg-cal/90 px-3 py-1">Antes</span>
        <span className="label absolute right-4 top-4 rounded-full bg-cal/90 px-3 py-1">Después</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Desliza para comparar antes y después"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 text-sm text-gris">{p.caption}</figcaption>
    </figure>
  );
}

export function BeforeAfter() {
  if (!features.beforeAfter || beforeAfter.length === 0) return null;
  return (
    <section className="wrap py-24" aria-labelledby="antes-despues">
      <p id="antes-despues" className="label">Antes y después</p>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {beforeAfter.map((p) => (
          <Pair key={p.after} p={p} />
        ))}
      </div>
    </section>
  );
}

"use client";

/**
 * Gráficos ligeros en HTML: una sola serie cada uno (sin leyenda; el título
 * la nombra), barras finas con extremo redondeado y valor al pasar el ratón.
 * Cada gráfico tiene su tabla equivalente para lectores de pantalla.
 */

export function WeeklyBars({ data }: { data: { label: string; count: number; current: boolean }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <figure className="m-0">
      <div className="flex h-44 items-end gap-2 border-b border-piedra" aria-hidden>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className={`w-full max-w-9 rounded-t-[4px] transition-colors ${d.current ? "bg-bronce" : "bg-grafito/75 group-hover:bg-grafito"}`}
              style={{ height: `${Math.max(d.count ? 4 : 0, (d.count / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-8 rounded bg-grafito px-2 py-1 text-xs text-cal opacity-0 transition-opacity group-hover:opacity-100">
              {d.count} {d.count === 1 ? "solicitud" : "solicitudes"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-[0.68rem] text-gris" aria-hidden>
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center tabular-nums">{d.label}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Solicitudes por semana</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><th>Semana del {d.label}</th><td>{d.count}</td></tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-3 text-xs text-gris">La barra dorada es la semana en curso.</figcaption>
    </figure>
  );
}

/** Barras horizontales con etiqueta y valor siempre visibles. */
export function HBars({
  rows, format = (n) => String(n), color,
}: {
  rows: { label: string; value: number; note?: string; color?: string }[];
  format?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              {r.color && <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />}
              {r.label}
            </span>
            <span className="tabular-nums">
              {format(r.value)}
              {r.note && <span className="ml-1 text-gris">{r.note}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 bg-lino" aria-hidden>
            <div className="h-2 rounded-r-[4px]" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? color ?? "#1c1b19" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

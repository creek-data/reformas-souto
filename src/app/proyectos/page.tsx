import { notFound } from "next/navigation";
import { projects } from "@/content/pending";
import { features } from "@/content/site";
import { pageMeta } from "@/lib/seo";

/** Preparada pero oculta (404) hasta tener fotos reales de obras propias con permiso. */
export const metadata = pageMeta({
  title: "Proyectos de pintura y reformas en Madrid",
  description: "Trabajos realizados por Souto Pinturas y Proyectos.",
  path: "/proyectos",
});

export default function ProyectosPage() {
  if (!features.projects || projects.length === 0) notFound();
  return (
    <section className="wrap pb-24 pt-36 md:pt-48">
      <p className="label">Proyectos</p>
      <h1 className="display mt-6 text-[3.2rem] md:text-[5rem]">Trabajos realizados</h1>
      <ul className="mt-14 grid gap-x-8 gap-y-16 md:grid-cols-2">
        {projects.map((p, i) => (
          <li key={p.slug} className={i % 2 ? "md:mt-24" : ""}>
            <div className="aspect-[4/5] overflow-hidden bg-lino" data-roller>
              <img src={p.cover} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <p className="display mt-5 text-3xl">{p.title}</p>
            <p className="mt-1 text-sm text-gris">{p.location} · {p.services.join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

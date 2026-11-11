import Link from "next/link";
import { Arrow, Steps } from "@/components/blocks";
import { site } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Empresa de pintura y reformas en Madrid",
  description:
    "Souto Pinturas y Proyectos SL: pintura, acabados y reformas en Madrid con equipo propio y colaboradores. Presupuesto por partidas y sin compromiso.",
  path: "/empresa",
});

const facts = [
  { k: "Qué somos", v: "Una empresa de pintura, acabados y reformas con sede en Madrid." },
  { k: "Quién trabaja", v: "Equipo propio y colaboradores especializados según el tipo de obra." },
  { k: "Dónde", v: "En Madrid y fuera de Madrid." },
  { k: "Cómo presupuestamos", v: "Por partidas, por escrito y sin compromiso." },
];

export default function EmpresaPage() {
  return (
    <>
      <section className="wrap grid gap-12 pb-20 pt-36 md:grid-cols-12 md:pb-28 md:pt-48">
        <div className="md:col-span-8">
          <p className="label">Empresa</p>
          <h1 className="display line-in mt-7 text-[3.2rem] sm:text-[4.4rem] lg:text-[6rem]">
            <span><span style={{ "--i": 0 } as React.CSSProperties}>Oficio, orden</span></span>
            <span><span style={{ "--i": 1 } as React.CSSProperties}><em>y palabra.</em></span></span>
          </h1>
          <p className="mt-8 max-w-[38rem] text-[1.125rem] leading-relaxed text-gris" data-reveal>
            En {site.name} hacemos pintura, acabados especiales y reformas generales. Nos importa lo que no se ve: la preparación del soporte,
            las capas bien hechas y un presupuesto que explique cada partida.
          </p>
        </div>
      </section>

      <section className="border-y border-piedra">
        <dl className="wrap grid md:grid-cols-2">
          {facts.map((f, i) => (
            <div key={f.k} className={`border-piedra py-10 md:px-0 ${i % 2 === 0 ? "md:border-r md:pr-12" : "md:pl-12"} ${i > 1 ? "border-t" : i === 1 ? "border-t md:border-t-0" : ""}`} data-reveal>
              <dt className="label">{f.k}</dt>
              <dd className="display mt-4 text-[1.9rem] md:text-[2.4rem]">{f.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="wrap py-24 md:py-32">
        <p className="label">Cómo trabajamos</p>
        <div className="mt-10">
          <Steps />
        </div>
        <Link href="/contacto" className="btn-solid mt-14">
          Pedir presupuesto <Arrow />
        </Link>
      </section>
    </>
  );
}

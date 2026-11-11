import Link from "next/link";
import { Arrow } from "@/components/blocks";
import { site } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Quiénes somos: empresa de pintura y reformas en Madrid",
  description:
    "Souto Pinturas y Proyectos SL: pintura, acabados, baños, fontanería y reformas en Madrid con equipo propio. Presupuesto por partidas, por escrito.",
  path: "/empresa",
});

const ways = [
  {
    t: "Primero miramos, luego hablamos de precio",
    d: "La calculadora te da una idea clara, pero el precio definitivo lo cerramos después de ver la obra. Así no hay sorpresas a mitad de trabajo.",
  },
  {
    t: "Un presupuesto que se entiende",
    d: "Cada partida con su medida y su precio, por escrito. Si algo no te encaja, lo quitas; si quieres añadir algo, lo sumamos.",
  },
  {
    t: "Preparar bien es la mitad del trabajo",
    d: "Protegemos suelos y muebles, saneamos grietas y lijamos antes de pintar. Es lo que no se ve en la foto y lo que hace que dure.",
  },
  {
    t: "Una sola empresa para toda la obra",
    d: "Pintura, pladur, fontanería y albañilería. Con equipo propio y colaboradores de confianza, para que no tengas que coordinar a nadie.",
  },
];

export default function EmpresaPage() {
  return (
    <>
      <section className="wrap grid gap-12 pb-20 pt-36 md:grid-cols-12 md:pb-28 md:pt-48">
        <div className="md:col-span-9">
          <h1 className="display text-[3.2rem] sm:text-[4.4rem] lg:text-[6rem]">
            Hacemos obras <em>como las querríamos en casa.</em>
          </h1>
          <p className="mt-8 max-w-[40rem] text-[1.125rem] leading-relaxed text-gris">
            {site.name} es una empresa de Madrid de pintura, acabados y reformas. Pintamos, alisamos gotelé, lacamos, aplicamos
            microcemento y epoxi, montamos pladur y reformamos baños. Lo único que no hacemos son ventanas.
          </p>
        </div>
      </section>

      <section className="border-y border-piedra bg-lino/60 py-20 md:py-28">
        <div className="wrap">
          <h2 className="display text-[2.4rem] md:text-[3.4rem]">Cómo trabajamos</h2>
          <ul className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {ways.map((w) => (
              <li key={w.t} className="border-t border-grafito pt-6">
                <h3 className="display text-[1.9rem] leading-tight md:text-[2.2rem]">{w.t}</h3>
                <p className="mt-4 max-w-md leading-relaxed text-gris">{w.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap grid gap-12 py-24 md:grid-cols-12 md:py-32">
        <div className="md:col-span-6">
          <h2 className="display text-[2.4rem] md:text-[3.4rem]">
            ¿Hablamos de <em>tu obra?</em>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-gris">Calcula tu precio o cuéntanos qué necesitas, y elige día para la visita.</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/calculadora" className="btn-solid">Calcular mi precio <Arrow /></Link>
            <Link href="/contacto" className="link-arrow">Contactar</Link>
          </div>
        </div>
        <dl className="grid content-start gap-5 border-t border-piedra pt-8 text-[0.95rem] md:col-span-5 md:col-start-8">
          <div><dt className="label">Razón social</dt><dd className="mt-1">{site.legalName}</dd></div>
          <div><dt className="label">CIF</dt><dd className="mt-1">{site.cif}</dd></div>
          <div><dt className="label">Dónde</dt><dd className="mt-1">{site.area}</dd></div>
          <div><dt className="label">Teléfono y WhatsApp</dt><dd className="mt-1 tabular-nums"><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a></dd></div>
        </dl>
      </section>
    </>
  );
}

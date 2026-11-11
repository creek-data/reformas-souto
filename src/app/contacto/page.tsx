import { ContactForm } from "@/components/ContactForm";
import { findService } from "@/content/services";
import { site, whatsappUrl } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Contacto y presupuesto sin compromiso",
  description:
    "Pide presupuesto a Souto Pinturas y Proyectos: pintura, acabados, baños, fontanería y reformas en Madrid. Reserva la visita online, llámanos o escríbenos por WhatsApp.",
  path: "/contacto",
});

export default async function ContactoPage({ searchParams }: { searchParams: Promise<{ servicio?: string }> }) {
  const s = findService((await searchParams).servicio ?? "");
  return (
    <section className="wrap grid gap-16 pb-24 pt-36 md:grid-cols-12 md:pb-36 md:pt-48">
      <div className="md:col-span-5">
        <p className="label">Contacto</p>
        <h1 className="display mt-7 text-[3.2rem] sm:text-[4.4rem] lg:text-[5.4rem]">
          Cuéntanos <em>qué tienes en mente.</em>
        </h1>
        <p className="mt-8 max-w-md text-[1.1rem] leading-relaxed text-gris">
          Déjanos tus datos y, si quieres, reserva ya el día de la visita. Vamos, medimos y te damos el presupuesto por escrito. Gratis
          y sin compromiso.
        </p>
        <dl className="mt-12 grid gap-6 border-t border-piedra pt-8">
          <div>
            <dt className="label">Teléfono y WhatsApp</dt>
            <dd className="mt-2 flex flex-wrap items-baseline gap-x-4 text-xl tabular-nums">
              <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
              <a href={whatsappUrl()} rel="noopener" className="text-base text-gris underline underline-offset-4">Escribir por WhatsApp</a>
            </dd>
          </div>
          <div>
            <dt className="label">Email</dt>
            <dd className="mt-2 break-all text-lg"><a href={`mailto:${site.email}`}>{site.email}</a></dd>
          </div>
          <div>
            <dt className="label">Instagram</dt>
            <dd className="mt-2 text-lg"><a href={site.instagram} rel="noopener">{site.instagramHandle}</a></dd>
          </div>
          <div>
            <dt className="label">Dónde trabajamos</dt>
            <dd className="mt-2 max-w-sm leading-relaxed text-gris">{site.areaLong}</dd>
          </div>
        </dl>
      </div>
      <div className="min-w-0 md:col-span-6 md:col-start-7 md:pt-4">
        {s && <p className="label mb-8">Sobre: {s.name}</p>}
        <ContactForm servicios={s ? [s.category] : undefined} submitLabel="Enviar" />
      </div>
    </section>
  );
}

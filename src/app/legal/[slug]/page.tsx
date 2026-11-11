import { notFound } from "next/navigation";
import { catalog, unitLabel } from "@/content/catalog";
import { site } from "@/content/site";
import { formatEuros } from "@/lib/pricing/engine";
import { pageMeta } from "@/lib/seo";

/**
 * Textos legales en BORRADOR, redactados con datos verificados.
 * Deben revisarlos un abogado o la gestoría antes del lanzamiento.
 */

const pages = {
  "aviso-legal": { title: "Aviso legal", description: "Datos identificativos del titular de la web." },
  privacidad: { title: "Política de privacidad", description: "Cómo tratamos tus datos personales." },
  cookies: { title: "Política de cookies", description: "Qué cookies usa esta web." },
  "hoja-informativa": { title: "Hoja informativa de precios", description: "Precios base de nuestros servicios, con IVA." },
} as const;
type Slug = keyof typeof pages;

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(pages).map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = pages[(await params).slug as Slug];
  return p ? { ...pageMeta({ ...p, path: `/legal/${(await params).slug}` }), robots: { index: false } } : {};
}

const H = ({ children }: { children: React.ReactNode }) => <h2 className="display mt-12 text-3xl">{children}</h2>;

function AvisoLegal() {
  return (
    <>
      <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa:</p>
      <ul>
        <li>Titular: {site.legalName}</li>
        <li>CIF: {site.cif}</li>
        <li>Domicilio social: {site.legalAddress}</li>
        <li>Email: {site.email} · Teléfono: {site.phoneDisplay}</li>
        <li>Inscripción: Registro Mercantil de Madrid{site.registryData ? `, ${site.registryData}` : ""}.</li>
      </ul>
      <H>Condiciones de uso</H>
      <p>
        Los precios que aparecen en esta web y en la calculadora son orientativos y no constituyen una oferta vinculante. El precio
        definitivo se fija en el presupuesto escrito que enviamos tras valorar el trabajo.
      </p>
      <p>Los contenidos de esta web son propiedad del titular o se usan con autorización. Las recreaciones de acabados son ilustraciones digitales.</p>
    </>
  );
}

function Privacidad() {
  return (
    <>
      <H>Responsable</H>
      <p>{site.legalName} (CIF {site.cif}), {site.legalAddress}. Contacto: {site.email}.</p>
      <H>Qué datos tratamos y para qué</H>
      <p>
        Los que nos facilitas en el formulario o la calculadora (nombre, teléfono, código postal y, si lo indicas, email, mensaje y datos de
        la obra) para responder a tu solicitud, concertar una visita y preparar tu presupuesto.
      </p>
      <H>Base jurídica</H>
      <p>La aplicación de medidas precontractuales a petición tuya y tu consentimiento al enviar el formulario.</p>
      <H>Conservación</H>
      <p>
        Las solicitudes que no lleguen a presupuesto aceptado se eliminan o anonimizan a los 12 meses. Si contratas, conservamos los datos
        durante la relación y los plazos legales aplicables.
      </p>
      <H>Destinatarios y proveedores</H>
      <p>
        No cedemos tus datos a terceros salvo obligación legal. Usamos proveedores tecnológicos que actúan como encargados del tratamiento
        (alojamiento web, base de datos y envío de emails), con contrato y garantías adecuadas cuando hay transferencias internacionales.
      </p>
      <H>Tus derechos</H>
      <p>
        Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad escribiendo a {site.email}.
        También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
      </p>
    </>
  );
}

function Cookies() {
  return (
    <>
      <p>
        Esta web no utiliza cookies de publicidad ni de analítica de terceros. Solo podría usar cookies técnicas imprescindibles para su
        funcionamiento, que no requieren consentimiento.
      </p>
      <p>
        Si en el futuro se añaden cookies que requieran consentimiento, se mostrará un aviso que permita aceptarlas o rechazarlas con la
        misma facilidad antes de instalarlas.
      </p>
    </>
  );
}

function HojaInformativa() {
  const vat = (c: number, r: number) => formatEuros(Math.round(c * (1 + r)));
  return (
    <>
      <p>
        Precios base de {site.legalName}. El precio final depende del estado de la superficie y de la ubicación, y se fija en el presupuesto
        previo por escrito. El tipo de IVA (10 % o 21 %) depende de los requisitos legales de cada obra.
      </p>
      <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de precios base">
        <table className="w-full min-w-[34rem] border-collapse text-left text-[0.95rem]">
          <thead>
            <tr className="border-b border-grafito">
              <th className="py-3 pr-4 font-medium">Servicio</th>
              <th className="py-3 pr-4 font-medium">Unidad</th>
              <th className="py-3 pr-4 text-right font-medium">Sin IVA</th>
              <th className="py-3 pr-4 text-right font-medium">IVA 10 %</th>
              <th className="py-3 text-right font-medium">IVA 21 %</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((i) => (
              <tr key={i.code} className="border-b border-piedra">
                <td className="py-3 pr-4">{i.name}</td>
                <td className="py-3 pr-4">{unitLabel[i.unit]}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatEuros(i.basePriceCents)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{vat(i.basePriceCents, 0.1)}</td>
                <td className="py-3 text-right tabular-nums">{vat(i.basePriceCents, 0.21)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <H>Desplazamiento</H>
      <p>Fuera de Madrid capital: {site.travelFeeNote}</p>
      <H>Reformas y restauración de muebles</H>
      <p>Se presupuestan tras visita, sin compromiso.</p>
    </>
  );
}

const bodies: Record<Slug, () => React.ReactNode> = {
  "aviso-legal": AvisoLegal,
  privacidad: Privacidad,
  cookies: Cookies,
  "hoja-informativa": HojaInformativa,
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug as Slug;
  const p = pages[slug];
  if (!p) notFound();
  const Body = bodies[slug];
  return (
    <article className="wrap pb-24 pt-36 md:pb-32 md:pt-48">
      <div className="max-w-3xl">
        <p className="label">Información legal</p>
        <h1 className="display mt-6 text-[3rem] md:text-[4.4rem]">{p.title}</h1>
        <div className="mt-10 space-y-5 text-[1.02rem] leading-relaxed text-gris [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
          <Body />
        </div>
      </div>
    </article>
  );
}

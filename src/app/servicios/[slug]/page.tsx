import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow, ServiceIndex } from "@/components/blocks";
import { Finish } from "@/components/Finish";
import { findItem, unitLabel } from "@/content/catalog";
import { findService, services } from "@/content/services";
import { site, siteUrl, whatsappUrl } from "@/content/site";
import { formatEuros } from "@/lib/pricing/engine";
import { jsonLdScript, pageMeta } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => services.map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = findService((await params).slug);
  if (!s) return {};
  return pageMeta({ title: s.seoTitle, description: s.description, path: `/servicios/${s.slug}` });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = findService((await params).slug);
  if (!s) notFound();
  const items = s.items.map(findItem).filter((i) => i != null);
  const others = services.filter((x) => x.slug !== s.slug).slice(0, 4);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: s.name,
      description: s.description,
      areaServed: { "@type": "City", name: "Madrid" },
      provider: { "@id": `${siteUrl}/#empresa` },
      ...(items.length
        ? {
            offers: items.map((i) => ({
              "@type": "Offer",
              name: i.name,
              priceCurrency: "EUR",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: (i.basePriceCents / 100).toFixed(2),
                priceCurrency: "EUR",
                valueAddedTaxIncluded: false,
                unitText: unitLabel[i.unit],
              },
            })),
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Servicios", item: `${siteUrl}/servicios` },
        { "@type": "ListItem", position: 3, name: s.name, item: `${siteUrl}/servicios/${s.slug}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <section className="wrap grid gap-12 pb-20 pt-32 md:grid-cols-12 md:pb-28 md:pt-44">
        <div className="md:col-span-7">
          <nav aria-label="Ruta" className="label">
            <Link href="/servicios" className="hover:text-grafito">Servicios</Link> <span aria-hidden>/</span> {s.name}
          </nav>
          <h1 className="display line-in mt-7 text-[3.2rem] sm:text-[4.4rem] lg:text-[6rem]">
            <span><span>{s.name}</span></span>
          </h1>
          <p className="mt-8 max-w-[36rem] text-[1.125rem] leading-relaxed text-gris" data-reveal>
            {s.lead}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4" data-reveal>
            {s.priced ? (
              <Link href={`/calculadora?trabajo=${s.category}`} className="btn-solid">
                Calcular mi precio <Arrow />
              </Link>
            ) : (
              <Link href={`/contacto?servicio=${s.slug}`} className="btn-solid">
                Pedir visita <Arrow />
              </Link>
            )}
            <a href={whatsappUrl(`Hola, quería información sobre ${s.name.toLowerCase()}.`)} rel="noopener" className="link-arrow">
              Consultar por WhatsApp
            </a>
          </div>
        </div>
        <div className="md:col-span-4 md:col-start-9">
          <div className="aspect-[4/5] overflow-hidden bg-lino" data-roller>
            <Finish kind={s.finish} />
          </div>
          <p className="mt-3 text-xs text-gris">Recreación digital del acabado, no es una fotografía de obra.</p>
        </div>
      </section>

      <section className="border-y border-piedra bg-lino/60 py-20 md:py-28">
        <div className="wrap grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label">Cómo lo hacemos</p>
            <ol className="mt-8 border-t border-piedra">
              {s.process.map((p, i) => (
                <li key={p} className="flex gap-6 border-b border-piedra py-5" data-reveal style={{ "--delay": `${i * 70}ms` } as React.CSSProperties}>
                  <span className="label tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[1.05rem]">{p}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="label">{items.length ? "Precios base" : "Precio"}</p>
            {items.length ? (
              <>
                <ul className="mt-8 border-t border-piedra">
                  {items.map((i) => (
                    <li key={i.code} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 border-b border-piedra py-6" data-reveal>
                      <span className="text-lg font-medium">{i.name}</span>
                      <span className="display text-3xl tabular-nums">
                        {formatEuros(i.basePriceCents)}
                        <span className="font-sans text-sm text-gris">/{unitLabel[i.unit]}</span>
                      </span>
                      <span className="col-span-2 text-[0.95rem] leading-relaxed text-gris">
                        {i.includes}
                        {i.materialNote ? ` ${i.materialNote}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-relaxed text-gris">
                  Precios sin IVA. Son precios base: el importe final depende del estado de la superficie y de la ubicación, y lo
                  confirmamos por escrito en el presupuesto.
                </p>
              </>
            ) : (
              <p className="mt-8 max-w-md text-[1.05rem] leading-relaxed text-gris">
                No damos precios cerrados sin ver el trabajo. Concertamos una visita, lo valoramos y te enviamos un presupuesto por partidas
                sin compromiso.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="wrap py-24 md:py-32">
        <p className="label">Otros servicios</p>
        <div className="mt-10">
          <ServiceIndex list={others} />
        </div>
        <p className="mt-10 text-[1.05rem] text-gris">
          ¿Prefieres hablarlo? <a href={`tel:${site.phone}`} className="text-grafito underline underline-offset-4">{site.phoneDisplay}</a>
        </p>
      </section>
    </>
  );
}

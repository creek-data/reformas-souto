import type { Metadata } from "next";
import { indexable, site, siteUrl } from "@/content/site";

export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${site.name}`, description, url: path, siteName: site.name, locale: "es_ES", type: "website" },
    robots: indexable ? undefined : { index: false, follow: false },
  };
}

/** Datos estructurados de la empresa. Solo datos verificados (sin valoraciones ni dirección de calle). */
export function businessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["HousePainter", "GeneralContractor"],
    "@id": `${siteUrl}/#empresa`,
    name: site.name,
    legalName: site.legalName,
    taxID: site.cif,
    url: siteUrl,
    telephone: site.phone,
    email: site.email,
    areaServed: { "@type": "City", name: "Madrid" },
    address: { "@type": "PostalAddress", addressLocality: "Madrid", addressRegion: "Comunidad de Madrid", addressCountry: "ES" },
    sameAs: [site.instagram],
  };
}

export const jsonLdScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

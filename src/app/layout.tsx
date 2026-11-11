import type { Metadata, Viewport } from "next";
import { Chrome } from "@/components/Chrome";
import { Footer, MobileBar } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealObserver } from "@/components/RevealObserver";
import { indexable, site, siteUrl } from "@/content/site";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} · Pintura, baños y reformas en Madrid`, template: `%s · ${site.name}` },
  description:
    "Pintura, alisado de gotelé, lacados, microcemento, baños, fontanería y reformas en Madrid. Calcula tu precio al momento y reserva la visita gratis.",
  applicationName: site.name,
  formatDetection: { telephone: false },
  robots: indexable ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f3efe7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-grafito focus:px-5 focus:py-3 focus:text-cal"
        >
          Saltar al contenido
        </a>
        <Chrome>
          <Header />
        </Chrome>
        <main id="contenido">{children}</main>
        <Chrome>
          <Footer />
          <MobileBar />
        </Chrome>
        <RevealObserver />
      </body>
    </html>
  );
}

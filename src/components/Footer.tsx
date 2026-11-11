import Link from "next/link";
import { servicesIn } from "@/content/services";
import { site, whatsappUrl } from "@/content/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-grafito pb-28 pt-20 text-cal md:pb-12 md:pt-28">
      <div className="wrap">
        <div className="grid gap-12 border-b border-cal/15 pb-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="display text-[2.75rem] md:text-[4.5rem]">
              ¿Lo vemos
              <br />
              <em>en persona?</em>
            </p>
            <p className="mt-6 max-w-md text-cal/70">Calcula tu precio y elige día para la visita. Te damos el presupuesto cerrado por escrito.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/calculadora" className="btn-solid !bg-cal !text-grafito hover:!bg-white">
                Calcular y reservar visita
              </Link>
              <a href={whatsappUrl()} className="btn-ghost !border-cal/40 !text-cal hover:!bg-cal hover:!text-grafito" rel="noopener">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 md:col-span-5">
            <div>
              <p className="label !text-cal/60">Contacto</p>
              <ul className="mt-4 space-y-2 text-[0.95rem]">
                <li>
                  <a href={`tel:${site.phone}`} className="tabular-nums hover:underline">{site.phoneDisplay}</a>
                </li>
                <li>
                  <a href={`mailto:${site.email}`} className="break-all hover:underline">{site.email}</a>
                </li>
                <li>
                  <a href={site.instagram} rel="noopener" className="hover:underline">Instagram {site.instagramHandle}</a>
                </li>
                <li className="text-cal/70">{site.area}</li>
              </ul>
            </div>
            <div>
              <p className="label !text-cal/60">Pintura y acabados</p>
              <ul className="mt-4 space-y-2 text-[0.95rem]">
                {servicesIn("acabados").map((s) => (
                  <li key={s.slug}>
                    <Link href={`/servicios/${s.slug}`} className="hover:underline">{s.name}</Link>
                  </li>
                ))}
              </ul>
              <p className="label mt-8 !text-cal/60">Reformas</p>
              <ul className="mt-4 space-y-2 text-[0.95rem]">
                {servicesIn("reformas").map((s) => (
                  <li key={s.slug}>
                    <Link href={`/servicios/${s.slug}`} className="hover:underline">{s.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8 pt-10 md:flex-row md:items-end md:justify-between">
          <Logo light />
          <nav aria-label="Información legal" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cal/70">
            <Link href="/legal/aviso-legal" className="hover:text-cal">Aviso legal</Link>
            <Link href="/legal/privacidad" className="hover:text-cal">Privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-cal">Cookies</Link>
            <Link href="/legal/hoja-informativa" className="hover:text-cal">Hoja informativa de precios</Link>
          </nav>
          <p className="text-sm text-cal/60">
            © {new Date().getFullYear()} {site.legalName} · CIF {site.cif}
            <span className="mt-1 block">Las texturas de la web son ilustraciones, no fotos de obra.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Barra inferior en móvil: lo esencial siempre a mano. */
export function MobileBar() {
  return (
    <nav
      aria-label="Acciones rápidas"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-piedra bg-cal/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <a href={`tel:${site.phone}`} className="flex min-h-14 items-center justify-center text-sm font-medium">
        Llamar
      </a>
      <a href={whatsappUrl()} rel="noopener" className="flex min-h-14 items-center justify-center border-x border-piedra text-sm font-medium">
        WhatsApp
      </a>
      <Link href="/calculadora" className="flex min-h-14 items-center justify-center bg-grafito text-sm font-medium text-cal">
        Mi precio
      </Link>
    </nav>
  );
}

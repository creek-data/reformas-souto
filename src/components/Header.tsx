"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

const nav = [
  { href: "/servicios", label: "Servicios" },
  { href: "/calculadora", label: "Calculadora" },
  { href: "/empresa", label: "Empresa" },
  { href: "/contacto", label: "Contacto" },
];

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={`display text-[1.9rem] ${light ? "text-cal" : "text-grafito"}`}>Souto</span>
      <span className={`mt-1 text-[0.62rem] font-medium uppercase tracking-[0.24em] ${light ? "text-cal/70" : "text-gris"}`}>
        Pinturas y Proyectos
      </span>
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const last = useRef(0);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setHidden(y > 160 && y > last.current);
      last.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[transform,background-color,border-color] duration-500 ease-[var(--ease-out-soft)] ${
          hidden && !open ? "-translate-y-full" : ""
        } ${scrolled || open ? "border-b border-piedra/70 bg-cal/92 backdrop-blur-md" : "border-b border-transparent"}`}
      >
        <div className="wrap flex h-[4.5rem] items-center justify-between md:h-20">
          <Link href="/" aria-label={`${site.name}, inicio`} className="py-2">
            <Wordmark />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-9 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={pathname.startsWith(n.href) ? "page" : undefined}
                className="text-[0.8rem] font-medium uppercase tracking-[0.16em] text-grafito/80 transition-colors hover:text-grafito aria-[current=page]:text-grafito"
              >
                {n.label}
              </Link>
            ))}
            <a href={`tel:${site.phone}`} className="text-sm tabular-nums text-gris hover:text-grafito">
              {site.phoneDisplay}
            </a>
            <Link href="/calculadora" className="btn-solid !min-h-11 !px-5 text-sm">
              Calcular mi precio
            </Link>
          </nav>
          <button
            type="button"
            className="-mr-2 flex min-h-11 min-w-11 items-center justify-center gap-3 px-2 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="label !text-grafito">{open ? "Cerrar" : "Menú"}</span>
            <span aria-hidden className="relative block h-3 w-6">
              <span className={`absolute left-0 h-px w-6 bg-grafito transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-6 bg-grafito transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </header>

      <div
        id="menu-movil"
        className={`fixed inset-0 z-30 bg-cal pt-24 transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!open}
      >
        <nav aria-label="Menú" className="wrap flex h-full flex-col pb-10">
          <ul className="border-t border-piedra">
            {[{ href: "/", label: "Inicio" }, ...nav].map((n, i) => (
              <li key={n.href} className="border-b border-piedra">
                <Link
                  href={n.href}
                  tabIndex={open ? 0 : -1}
                  className="flex items-baseline justify-between py-5"
                  aria-current={pathname === n.href ? "page" : undefined}
                >
                  <span className="display text-[2.6rem]">{n.label}</span>
                  <span className="label">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-3 text-[1.05rem]">
            <a tabIndex={open ? 0 : -1} href={`tel:${site.phone}`} className="tabular-nums">
              {site.phoneDisplay}
            </a>
            <a tabIndex={open ? 0 : -1} href={`mailto:${site.email}`} className="text-gris">
              {site.email}
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}

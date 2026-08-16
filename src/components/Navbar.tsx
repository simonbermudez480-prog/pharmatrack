"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "#problema", label: "Problema" },
  { href: "#solucion", label: "Solución" },
  { href: "/precios", label: "Precios" },
  { href: "#testimonios", label: "Testimonios" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-md shadow-[0_2px_20px_rgba(11,61,46,0.08)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-10 h-20 flex items-center justify-between">
        <a href="#top" aria-label="PharmaTrack inicio">
          <Logo size={28} />
        </a>

        {/* Links desktop */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-forest-ink/80">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="hover:text-forest transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-accent after:transition-all"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center h-11 px-3 text-forest font-semibold text-sm hover:text-accent transition-colors"
          >
            Iniciar sesión
          </a>
          <a
            href="/registro"
            className="inline-flex items-center justify-center h-11 px-5 rounded-btn bg-accent/10 text-forest font-semibold text-sm border border-accent/30 hover:bg-accent hover:text-white transition-colors"
          >
            3 días gratis
          </a>
        </div>

        {/* Hamburguesa móvil */}
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span
            className={`block h-0.5 w-6 bg-forest transition-transform ${
              open ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-forest transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-forest transition-transform ${
              open ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Menú móvil */}
      {open && (
        <div className="md:hidden bg-cream/98 backdrop-blur-md border-t border-forest/10 shadow-[0_8px_24px_rgba(11,61,46,0.08)]">
          <ul className="px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 px-2 text-forest-ink/80 hover:bg-accent/10 rounded-lg hover:text-forest transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2 flex gap-2">
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 flex items-center justify-center h-12 rounded-btn border border-forest/15 text-forest font-semibold"
              >
                Iniciar sesión
              </a>
              <a
                href="/registro"
                onClick={() => setOpen(false)}
                className="flex-1 flex items-center justify-center h-12 rounded-btn bg-accent text-white font-semibold"
              >
                3 días gratis
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

export default Navbar;

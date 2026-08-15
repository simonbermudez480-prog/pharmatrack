import { Logo } from "./Logo";

const FOOTER_COLS = [
  {
    title: "Producto",
    links: [
      { label: "Funciones", href: "#solucion" },
      { label: "Precios", href: "#precios" },
      { label: "Soporte", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Empleo", href: "#" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "hola@pharmatrack.co", href: "mailto:hola@pharmatrack.co" },
      { label: "WhatsApp +58 4268316691", href: "https://wa.me/584268316691" },
      { label: "Medellín, Colombia", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="px-4 sm:px-6 lg:px-10 pt-12">
      <div className="u-arched-top max-w-7xl mx-auto bg-forest-ink rounded-b-[40px] rounded-t-card px-6 sm:px-10 lg:px-16 pt-16 pb-10 text-white">
        <div className="grid lg:grid-cols-[1.5fr_2fr] gap-12">
          {/* Logo + claim */}
          <div>
            <Logo size={28} variant="light" />
            <p className="mt-5 text-white/70 text-sm max-w-xs leading-relaxed">
              Recordatorios de adherencia que estabilizan los ingresos de
              farmacias independientes.
            </p>
          </div>

          {/* Columnas de links */}
          <div className="grid sm:grid-cols-3 gap-8">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-bold tracking-widest uppercase text-accent-soft mb-4">
                  {col.title}
                </div>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-white/75 hover:text-white transition-colors"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/55 text-center sm:text-left">
            © {new Date().getFullYear()} PharmaTrack. Estabilizamos ingresos de
            farmacias independientes.
          </p>
          <ul className="flex items-center gap-5">
            {[
              { name: "X", href: "#" },
              { name: "LinkedIn", href: "#" },
              { name: "Instagram", href: "https://www.instagram.com/phaarma.track/" },
            ].map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  aria-label={s.name}
                  className="text-xs text-white/60 hover:text-accent-soft transition-colors"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

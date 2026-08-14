const SOLUTION_BENEFITS = [
  "Registras al paciente crónico en menos de 1 minuto cuando viene a comprar su tratamiento",
  "PharmaTrack programa los recordatorios según la posología de cada tratamiento",
  "El sistema le recuerda volver antes de que se le acabe y compre en otra farmacia",
];

export function Solucion() {
  return (
    <section id="solucion" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-[45%_55%] gap-12 lg:gap-16 items-center">
        {/* Visual: panel de PharmaTrack */}
        <div className="u-shadow-soft-lg bg-white rounded-card p-5 sm:p-6 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold tracking-widest text-forest/60 uppercase">
                Panel PharmaTrack
              </div>
              <div className="font-display font-bold text-forest text-lg">
                Pacientes crónicos
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-forest font-semibold">
              247 activos
            </span>
          </div>

          {/* Filas de pacientes */}
          <ul className="divide-y divide-forest/8 rounded-2xl bg-cream/60 px-4">
            {[
              {
                name: "María Restrepo",
                treatment: "Losartán 50mg",
                state: "Recordatorio · 12 mar",
                tone: "ok",
              },
              {
                name: "Jorge Cancino",
                treatment: "Metformina 850mg",
                state: "Enviado ✓",
                tone: "ok",
              },
              {
                name: "Elena Zapata",
                treatment: "Atorvastatina 20mg",
                state: "Vuelve hoy · 5/12",
                tone: "warn",
              },
              {
                name: "Carlos Mejía",
                treatment: "Enalapril 10mg",
                state: "Programado · 8/12",
                tone: "ok",
              },
            ].map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between py-3.5"
              >
                <div>
                  <div className="font-semibold text-forest-ink text-sm">
                    {p.name}
                  </div>
                  <div className="text-xs text-forest-ink/60">
                    {p.treatment}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    p.tone === "ok"
                      ? "bg-forest/10 text-forest"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {p.state}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 text-xs text-forest-ink/55 text-center">
            Captura ilustrativa del panel · Demo en vivo en tu prueba gratis
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-forest mb-4">
            La solución
          </span>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-forest leading-tight">
            Recordatorios automáticos que{" "}
            <span className="u-accent-underline">estabilizan tus ingresos</span>.
          </h2>
          <p className="mt-6 text-lg text-forest-ink/75 leading-relaxed">
            Cada vez que un paciente con tratamiento crónico viene a comprar,
            lo registras en el mostrador en menos de 1 minuto. PharmaTrack toma
            desde ahí el control de los recordatorios.
          </p>
          <p className="mt-3 text-lg text-forest-ink/75 leading-relaxed">
            Tú solo registras una vez.{" "}
            <span className="font-semibold text-forest">El sistema hace el resto solo.</span>
          </p>

          <ul className="mt-8 space-y-3">
            {SOLUTION_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-bold shrink-0"
                >
                  ✓
                </span>
                <span className="text-forest-ink/85">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <a
              href="#contacto"
              className="inline-flex items-center justify-center h-12 px-6 rounded-btn border-2 border-forest text-forest font-bold text-sm hover:bg-forest hover:text-white transition-colors"
            >
              Ver cómo funciona →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Solucion;

const TRUST = [
  "3 días gratis con tarjeta",
  "Cancelas cuando quieras",
  "Soporte por WhatsApp",
  "+180 farmacias activas",
];

export function CTAFinal() {
  return (
    <section id="contacto" className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-forest leading-tight">
          Estabiliza tus ingresos{" "}
          <span className="u-accent-underline">ya</span>.
        </h2>

        <p className="mt-6 text-lg text-forest-ink/75 max-w-xl mx-auto leading-relaxed">
          3 días gratis. Implementación en 1 día. Sin compromiso. Si
          PharmaTrack no recupera al menos a 5 pacientes crónicos el primer
          mes,{" "}
          <span className="font-semibold text-forest">
            te devolvemos el tiempo.
          </span>
        </p>

        <div className="mt-8">
          <a
            href="/registro"
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-btn bg-forest text-white font-bold text-base hover:bg-forest-dark transition-all hover:scale-[1.02] shadow-[0_8px_24px_rgba(11,61,46,0.25)]"
          >
            3 días gratis, con tarjeta. Escríbenos →
          </a>
          <p className="mt-3 text-sm text-forest-ink/55">
            Respondemos en menos de 2 horas hábiles.
          </p>
        </div>

        {/* Franja de confianza */}
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {TRUST.map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-2 text-sm text-forest-ink/70"
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold"
              >
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default CTAFinal;

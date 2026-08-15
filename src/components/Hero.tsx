export function Hero() {
  return (
    <section
      id="top"
      className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden"
    >
      {/* Halo decorativo sutil de fondo */}
      <div
        aria-hidden
        className="absolute -top-20 -right-40 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-40 w-[500px] h-[500px] rounded-full bg-forest/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
        {/* Columna de texto */}
        <div className="u-fade-up">
          <span className="inline-block px-3 py-1 rounded-full bg-forest/8 text-forest text-xs font-bold tracking-widest uppercase mb-6">
            Para farmacias independientes
          </span>

          <h1 className="font-display font-extrabold text-forest leading-[1.04] text-5xl sm:text-6xl lg:text-7xl tracking-tight">
            VUELVEN <br className="hidden sm:block" />
            a tu <span className="u-accent-underline">mostrador</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-forest-ink/75 max-w-xl leading-relaxed">
            El sistema que{" "}
            <span className="u-accent-underline font-semibold text-forest">
              automatiza
            </span>{" "}
            los recordatorios de tus pacientes crónicos para que no se olviden
            de volver a comprar.
          </p>

          <p className="mt-4 text-base text-forest-ink/65 max-w-xl leading-relaxed">
            1 de cada 2 no vuelve a tiempo. Es la venta recurrente que tu
            farmacia pierde cada mes{" "}
            <span className="font-semibold text-forest">sin darte cuenta.</span>
          </p>

          <div className="mt-8">
            <a
              href="/registro"
              className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-btn bg-forest text-white font-bold text-base hover:bg-forest-dark transition-all hover:scale-[1.02] shadow-[0_8px_24px_rgba(11,61,46,0.25)]"
            >
              3 días gratis, con tarjeta. Escríbenos →
            </a>
            <p className="mt-3 text-sm text-forest-ink/55">
              3 días gratis con tarjeta · Cancelas cuando quieras · Implementación
              en 1 día
            </p>
          </div>
        </div>

        {/* Columna visual: mockup de recordatorio */}
        <div className="u-fade-up [animation-delay:150ms]">
          <div className="relative u-shadow-soft-lg bg-white rounded-card p-6 sm:p-7 max-w-md mx-auto">
            {/* Encabezado del mock */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="w-2.5 h-2.5 rounded-full bg-accent"
                />
                <span className="text-xs font-bold tracking-widest text-forest/70 uppercase">
                  Recordatorio enviado
                </span>
              </div>
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold"
              >
                ✓
              </span>
            </div>

            {/* Cuerpo del mensaje */}
            <div className="rounded-2xl bg-cream p-5">
              <p className="text-forest-ink/85 leading-relaxed">
                <span className="font-semibold text-forest">Hola María,</span>{" "}
                es momento de renovar tu tratamiento de presión. Pásate por
                Farmacia Central.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-forest-ink/50">
                  vía WhatsApp
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
                  <span className="text-accent">✓</span> Confirmado · hace 2 min
                </span>
              </div>
            </div>

            {/* Micro-badges */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric value="+32%" label="recurrencia" />
              <Metric value="-18%" label="abandono" />
              <Metric value="0" label="esfuerzo manual" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center rounded-xl bg-forest/5 px-2 py-3">
      <div className="text-xl font-extrabold text-forest leading-none">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-forest-ink/60 leading-tight">
        {label}
      </div>
    </div>
  );
}

export default Hero;

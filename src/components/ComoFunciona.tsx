const STEPS = [
  {
    num: "01",
    title: "REGISTRA",
    body: "Cuando un paciente con tratamiento crónico llega a comprar, lo registras en el mostrador en menos de 1 minuto: nombre, tratamiento y posología. Nada más.",
  },
  {
    num: "02",
    title: "RECUPERA",
    body: "PharmaTrack calcula cuándo se le acaba el tratamiento y le recuerda volver por SMS o WhatsApp al momento exacto. Tú no decides nada — ese es el truco.",
  },
  {
    num: "03",
    title: "FIDELIZA",
    body: "El paciente vuelve a tu mostrador por su tratamiento. Ingresos estables sin esfuerzo operativo extra.",
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-forest mb-4">
            Cómo funciona
          </span>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-forest leading-tight">
            De venta única a venta recurrente en{" "}
            <span className="u-accent-underline">3 pasos</span>
          </h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-10 lg:gap-12">
          {/* Línea conectora discontinua naranja (desktop) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-7 left-[16%] right-[16%] h-0.5 u-dashed-line"
          />

          {STEPS.map((s) => (
            <div key={s.num} className="relative text-center">
              <div className="relative inline-flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl sm:text-6xl font-extrabold text-accent leading-none">
                  {s.num}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-forest mb-3 tracking-wide">
                {s.title}
              </h3>
              <p className="text-forest-ink/70 leading-relaxed max-w-xs mx-auto">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComoFunciona;

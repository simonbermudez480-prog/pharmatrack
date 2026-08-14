const HARD_DATA = [
  {
    number: "+32%",
    label: "recurrencia en crónicos",
    sub: "≈ +$3,3M/mes en una farmacia con 250 crónicos",
  },
  {
    number: "-68%",
    label: "menos abandono de tratamiento",
    sub: "entre los pacientes recordados",
  },
  {
    number: "100%",
    label: "automático, sin llamadas manuales",
    sub: "ni personal extra",
  },
];

export function Testimonios() {
  return (
    <section
      id="testimonios"
      className="px-4 sm:px-6 lg:px-10 py-12"
    >
      <div className="u-arched-top u-arched-bottom max-w-7xl mx-auto bg-forest rounded-card px-6 sm:px-10 lg:px-16 py-20 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center text-white">
        {/* Testimonio */}
        <div>
          <span
            aria-hidden
            className="block text-7xl leading-none text-accent font-serif select-none"
          >
            &ldquo;
          </span>
          <p className="-mt-4 text-2xl sm:text-3xl font-display font-bold leading-snug">
            Antes perdía a unos 40 pacientes crónicos al mes porque se
            olvidaban. Ahora me vuelven solos. Mis ingresos del área de
            crónicos{" "}
            <span className="text-accent-soft u-accent-underline">
              subieron un 32%
            </span>{" "}
            en tres meses.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div
              aria-hidden
              className="w-14 h-14 rounded-full bg-accent/30 flex items-center justify-center font-display font-bold text-xl text-white"
            >
              MF
            </div>
            <div>
              <div className="font-semibold text-lg">María Fernanda López</div>
              <div className="text-white/70 text-sm">
                Dueña · Farmacia Central — Medellín
              </div>
            </div>
          </div>
          <div className="mt-4 u-stars text-xl" aria-label="5 de 5 estrellas">
            ★★★★★
          </div>
        </div>

        {/* Datos hard */}
        <div className="grid gap-6">
          {HARD_DATA.map((d) => (
            <div
              key={d.number}
              className="flex items-end gap-6 border-b border-white/10 pb-6"
            >
              <div className="text-5xl sm:text-6xl font-extrabold leading-none min-w-[180px]">
                {d.number}
              </div>
              <div>
                <div className="text-accent-soft text-sm font-bold tracking-widest uppercase">
                  {d.label}
                </div>
                <div className="text-white/70 text-sm mt-1">{d.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonios;

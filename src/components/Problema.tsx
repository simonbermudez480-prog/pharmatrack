const PROBLEM_METRICS = [
  {
    number: "1 de cada 2",
    label: "pacientes crónicos no vuelve a tiempo a su farmacia",
  },
  {
    number: "$42.000",
    label: "peso promedio perdido por paciente que se olvida de renovar",
  },
  {
    number: "30 días",
    label: "de tratamiento olvidado = venta recurrente perdida para siempre",
  },
];

export function Problema() {
  return (
    <section id="problema" className="px-4 sm:px-6 lg:px-10 py-12">
      <div className="u-arched-top max-w-7xl mx-auto bg-forest rounded-b-[40px] px-6 sm:px-10 lg:px-16 py-20 lg:py-28 text-center text-white relative overflow-hidden">
        {/* Halo sutil */}
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-forest-light/40 blur-3xl rounded-full"
        />

        <div className="relative">
          <span className="inline-block text-accent-soft text-xs font-bold tracking-[0.2em] uppercase mb-5">
            El problema que no ves
          </span>

          <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mx-auto">
            Tu farmacia pierde ventas recurrentes cada mes, sin que te des
            cuenta.
          </h2>

          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            El paciente crónico compró su tratamiento una vez. Luego se olvidó.
            Y tú no le recordaste — porque no puedes llamar a 800 clientes uno
            por uno.
          </p>

          {/* Cards de métricas */}
          <div className="mt-14 grid sm:grid-cols-3 gap-5 lg:gap-7">
            {PROBLEM_METRICS.map((m) => (
              <div
                key={m.number}
                className="bg-forest-light/70 backdrop-blur-sm rounded-2xl p-7 text-center border border-white/5"
              >
                <div className="text-4xl sm:text-5xl font-extrabold text-accent-soft leading-none">
                  {m.number}
                </div>
                <p className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Problema;

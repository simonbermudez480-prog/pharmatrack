import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Precios — PharmaTrack",
  description:
    "3 planes para farmacias independientes. Empezá tus 3 días gratis con tarjeta.",
};

const PLANS = [
  {
    tier: "basic" as const,
    name: "Basic",
    price: 29,
    limite: "100 pacientes crónicos",
    highlighted: false,
    features: [
      "100 pacientes crónicos",
      "Recordatorios automáticos (WhatsApp o email)",
      "Panel de control completo",
      "Soporte por correo",
    ],
    cta: "Empezar con Basic",
  },
  {
    tier: "pro" as const,
    name: "Pro",
    price: 59,
    limite: "250 pacientes crónicos",
    highlighted: true,
    features: [
      "250 pacientes crónicos",
      "Recordatorios automáticos (WhatsApp o email)",
      "Panel de control completo",
      "Reportes de recurrencia y abandono",
      "Soporte prioritario por WhatsApp",
    ],
    cta: "Empezar con Pro (recomendado)",
  },
  {
    tier: "business" as const,
    name: "Business",
    price: 99,
    limite: "Pacientes ilimitados",
    highlighted: false,
    features: [
      "Pacientes crónicos ilimitados",
      "Todo lo del plan Pro",
      "Agente IA de seguimiento de adherencia",
      "Onboarding asistido por farmacia",
      "Soporte dedicado + SLA",
    ],
    cta: "Empezar con Business",
  },
];

export default async function PreciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sub } = user
    ? await supabase
        .from("suscripciones")
        .select("plan, estado, fin_trial")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const isLoggedIn = !!user;
  const isVencido = user
    ? !sub || sub.estado === "vencida" || sub.estado === "cancelada"
    : false;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {/* Banner si el trial/pago venció */}
          {isLoggedIn && isVencido && (
            <div className="mb-8 rounded-card bg-accent/10 border border-accent/20 px-5 py-4 text-center text-forest">
              <strong>Tu período de prueba terminó.</strong> Elegí un plan para
              seguir usando PharmaTrack.
            </div>
          )}
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-forest mb-4">
              Precios
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-forest leading-tight">
              Estabilizá tus ingresos{" "}
              <span className="u-accent-underline">sin sorpresas</span>
            </h1>
            <p className="mt-5 text-lg text-forest-ink/75">
              3 días gratis con tarjeta. Después del trial, elegís el plan que
              mejor encaja con tu farmacia. Cancelás cuando quieras.
            </p>
          </div>

          {/* Grid de planes */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative rounded-card p-8 flex flex-col ${
                  plan.highlighted
                    ? "bg-forest text-white u-shadow-soft-lg md:-translate-y-3"
                    : "bg-white text-forest-ink u-shadow-soft"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute top-5 right-5 inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-accent text-white">
                    Recomendado
                  </span>
                )}

                <h2
                  className={`font-display font-extrabold text-2xl ${
                    plan.highlighted ? "text-white" : "text-forest"
                  }`}
                >
                  {plan.name}
                </h2>

                <div className="mt-4 flex items-end gap-1">
                  <span
                    className={`text-5xl font-extrabold leading-none ${
                      plan.highlighted ? "text-white" : "text-forest"
                    }`}
                  >
                    ${plan.price}
                  </span>
                  <span
                    className={`text-sm pb-1 ${
                      plan.highlighted ? "text-white/70" : "text-forest-ink/60"
                    }`}
                  >
                    /mes
                  </span>
                </div>

                <p
                  className={`mt-2 text-sm ${
                    plan.highlighted ? "text-white/80" : "text-forest-ink/70"
                  }`}
                >
                  {plan.limite}
                </p>

                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 ${
                          plan.highlighted
                            ? "bg-accent text-white"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={
                          plan.highlighted ? "text-white/90" : "text-forest-ink/80"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link
                    href={isLoggedIn ? `/activar/${plan.tier}` : `/registro`}
                    className={`inline-flex items-center justify-center w-full h-12 px-6 rounded-btn font-bold text-sm transition-colors ${
                      plan.highlighted
                        ? "bg-accent text-white hover:bg-accent-soft"
                        : "bg-forest text-white hover:bg-forest-dark"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Garantías */}
          <div className="mt-12 grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              ["3 días", "de prueba gratis"],
              ["Con tarjeta", "para registrarte"],
              ["Cancelás", "cuando quieras"],
            ].map(([a, b]) => (
              <div key={a} className="text-center">
                <div className="text-2xl font-extrabold text-forest">{a}</div>
                <div className="text-sm text-forest-ink/60">{b}</div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl text-forest text-center mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-6">
              <FAQ
                q="¿Cuando cobran?"
                a="Tenés 3 días gratis con tarjeta desde que te registrás. Si no pagás al terminarse el trial, el panel queda en pausa — no cobramos sorpresivamente."
              />
              <FAQ
                q="¿Qué pasa si me paso del límite de pacientes?"
                a="Si estás en Basic o Pro y llegás al límite, el sistema te avisa y te ofrece upgrade. No cortamos el servicio: vos decidés cuándo subir de plan."
              />
              <FAQ
                q="¿Cómo pago la suscripción?"
                a="Con PayPal: una sola autorización y se cobra automáticamente cada mes. Sin pedirte reloggear cada vez."
              />
            </div>
          </div>

          {/* CTA final */}
          <div className="mt-20 text-center">
            <p className="text-xs text-forest-ink/55">
              ¿YA TENÉS CUENTA?{" "}
              <Link href="/login" className="font-semibold text-forest hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-white rounded-btn p-5 u-shadow-soft">
      <summary className="font-semibold text-forest cursor-pointer list-none flex justify-between items-center">
        {q}
        <span
          aria-hidden
          className="ml-2 text-forest/40 group-open:rotate-45 transition-transform select-none"
        >
          +
        </span>
      </summary>
      <p className="mt-3 text-sm text-forest-ink/70 leading-relaxed">{a}</p>
    </details>
  );
}

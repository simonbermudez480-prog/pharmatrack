import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { SubscriptionButton } from "@/components/SubscriptionButton";
import { PLAN_INFO, PLAN_TIERS, type PlanTier } from "@/lib/paypal";

export const metadata: Metadata = {
  title: "Activar plan",
  robots: { index: false, follow: false },
};

export default async function ActivarPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier: tierParam } = await params;
  const tier = PLAN_TIERS.find((t) => t === tierParam) as PlanTier | undefined;
  if (!tier) {
    redirect("/precios");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nombreFarmacia =
    (user.user_metadata?.nombre_farmacia as string | undefined) ?? "Mi farmacia";
  const plan = PLAN_INFO[tier];

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-white border-b border-forest/10">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} showTagline={false} />
            <span className="hidden sm:inline-block text-forest-ink/30">/</span>
            <span className="hidden sm:inline-block text-sm font-semibold text-forest-ink/70">
              Activar plan {plan.name}
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 lg:px-10 py-14">
        <p className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
          <span className="text-accent">✓</span> {nombreFarmacia}
        </p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-forest leading-tight">
          Activar plan {plan.name}
        </h1>
        <p className="mt-3 text-forest-ink/75">
          Vas a subscribirte al plan{" "}
          <span className="font-semibold text-forest">{plan.name}</span>:
          <span className="font-bold text-forest"> ${plan.price} USD/mes</span> con
          hasta <span className="font-semibold">{plan.limite}</span>.{" "}
          PayPal procesa el pago de forma segura.
        </p>

        {/* Resumen del plan */}
        <div className="mt-7 bg-white rounded-card u-shadow-soft p-6">
          <div className="flex items-baseline justify-between mb-4">
            <span className="font-display font-bold text-xl text-forest">
              {plan.name}
            </span>
            <span className="text-2xl font-extrabold text-forest">
              ${plan.price}
              <span className="text-sm font-normal text-forest-ink/50">/mes</span>
            </span>
          </div>
          <div className="border-t border-forest/10 pt-4 text-sm text-forest-ink/70">
            <div className="flex justify-between py-1">
              <span>Límite de pacientes</span>
              <span className="font-semibold text-forest">{plan.limite}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Facturación</span>
              <span className="font-semibold text-forest">Mensual automática</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Cancelar</span>
              <span className="font-semibold text-forest">Cuando quieras</span>
            </div>
          </div>
        </div>

        {/* Botón PayPal */}
        <div className="mt-6 bg-white rounded-card u-shadow-soft p-6">
          <h2 className="font-display font-bold text-lg text-forest mb-3">
            Pagar con PayPal
          </h2>
          {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
            <SubscriptionButton tier={tier} />
          ) : (
            <div className="rounded-btn bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-forest-ink/70">
              ⚙️ Está activo el modo demo. Para activar pagos reales pegá{" "}
              <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> en{" "}
              <code>.env.local</code> y reinicia.
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-forest-ink/55 text-center">
          🔒 Pago procesado por PayPal. PharmaTrack no guarda información de
          tarjetas.
        </p>
      </div>
    </main>
  );
}

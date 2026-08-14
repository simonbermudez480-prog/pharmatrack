import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Suscripción activada",
  robots: { index: false, follow: false },
};

export default async function ExitoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("suscripciones")
    .select("plan, estado, fin_periodo")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-white border-b border-forest/10">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} showTagline={false} />
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        {sub?.estado === "activa" ? (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-forest flex items-center justify-center text-4xl text-white mb-6">
              ✓
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-forest">
              ¡Suscripción activada!
            </h1>
            <p className="mt-3 text-forest-ink/70">
              Plan{" "}
              <span className="font-bold text-forest uppercase">{sub.plan}</span>{" "}
              activo. El próximo cobro será{" "}
              {sub.fin_periodo
                ? new Date(sub.fin_periodo).toLocaleDateString("es-CO")
                : "en 30 días"}.
            </p>
            <a
              href="/dashboard"
              className="mt-8 inline-flex h-12 px-7 rounded-btn bg-forest text-white font-bold hover:bg-forest-dark transition-colors"
            >
              Ir a mi panel →
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-cream flex items-center justify-center text-3xl mb-6">
              ⏳
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-forest">
              Estamos confirmando tu pago
            </h1>
            <p className="mt-3 text-forest-ink/70">
              PayPal está procesando tu suscripción. Esto tarda unos segundos.
              Refrescá la página o volvé en 1 minuto — cuando el webhook confirme,
              vas a ver el plan activo acá.
            </p>
            <a
              href="/dashboard"
              className="mt-8 inline-flex h-12 px-7 rounded-btn border border-forest/20 text-forest font-semibold hover:bg-forest/5 transition-colors"
            >
              Volver al panel
            </a>
          </>
        )}
      </div>
    </main>
  );
}

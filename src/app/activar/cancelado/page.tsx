import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Suscripción cancelada",
  robots: { index: false, follow: false },
};

export default async function CanceladoPage() {
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
        <div className="mx-auto w-20 h-20 rounded-full bg-cream flex items-center justify-center text-3xl mb-6">
          ✕
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-forest">
          Suscripción cancelada
        </h1>
        <p className="mt-3 text-forest-ink/70">
          Cancelaste antes de que PayPal terminara. No se realizó ningún cobro.
          Podés volver cuando quieras.
        </p>
        <a
          href="/dashboard"
          className="mt-8 inline-flex h-12 px-7 rounded-btn border border-forest/20 text-forest font-semibold hover:bg-forest/5 transition-colors"
        >
          Volver al panel
        </a>
      </div>
    </main>
  );
}

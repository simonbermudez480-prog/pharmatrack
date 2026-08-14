import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { RegistrarPacienteForm } from "@/components/RegistrarPacienteForm";

export const metadata: Metadata = {
  title: "Registrar paciente",
  robots: { index: false, follow: false },
};

export default async function RegistrarPacientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const nombreFarmacia =
    (user.user_metadata?.nombre_farmacia as string | undefined) ?? "Mi farmacia";

  return (
    <main className="min-h-screen bg-cream">
      {/* Top bar */}
      <header className="bg-white border-b border-forest/10">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} showTagline={false} />
            <span className="hidden sm:inline-block text-forest-ink/30">/</span>
            <span className="hidden sm:inline-block text-sm font-semibold text-forest-ink/70">
              Registrar paciente
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 lg:px-10 py-12">
        {/* Back link */}
        <a
          href="/dashboard"
          className="inline-flex items-center text-sm text-forest-ink/70 hover:text-forest transition-colors mb-6"
        >
          ← Volver al panel
        </a>

        <p className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
          <span className="text-accent">✓</span> {nombreFarmacia}
        </p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-forest leading-tight">
          Registrar paciente crónico
        </h1>
        <p className="mt-2 text-forest-ink/70 max-w-lg">
          Completá los datos en menos de 1 minuto. A partir de acá PharmaTrack
          programa los recordatorios automáticamente.
        </p>

        <div className="mt-8 bg-white rounded-card u-shadow-soft p-6 sm:p-10">
          <RegistrarPacienteForm />
        </div>
      </div>
    </main>
  );
}

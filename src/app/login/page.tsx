import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Entrá a tu panel de PharmaTrack para gestionar los recordatorios de tus pacientes crónicos.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream py-16 px-6">
      <Suspense fallback={<div className="text-forest-ink/60">Cargando…</div>}>
        <AuthForm initialMode="login" />
      </Suspense>
    </main>
  );
}

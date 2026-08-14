import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Registá tu farmacia en PharmaTrack. 2 semanas gratis, sin tarjeta de crédito.",
  robots: { index: false, follow: false },
};

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream py-16 px-6">
      <Suspense fallback={<div className="text-forest-ink/60">Cargando…</div>}>
        <AuthForm initialMode="registro" />
      </Suspense>
    </main>
  );
}

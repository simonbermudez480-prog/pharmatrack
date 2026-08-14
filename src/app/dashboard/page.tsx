import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { RegistrarPacienteButton } from "@/components/RegistrarPacienteButton";
import type { Metadata } from "next";
import type { Database } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Panel de control",
  robots: { index: false, follow: false },
};

type Paciente = Database["public"]["Tables"]["pacientes"]["Row"];

function estadoDe(p: Paciente): { tone: "ok" | "warn" | "idle"; label: string } {
  if (!p.proximo_recordatorio) return { tone: "idle", label: "Sin programar" };
  const proximo = new Date(p.proximo_recordatorio);
  const ahora = new Date();
  const dias = Math.ceil((proximo.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

  if (dias < 0) return { tone: "warn", label: "Vence hoy — requerido" };
  if (dias <= 3) return { tone: "warn", label: `Recordar en ${dias}d` };
  if (dias <= 7) return { tone: "ok", label: `Recordar en ${dias}d` };
  return { tone: "ok", label: `Recordar en ${dias}d` };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: pacientes,
    error,
  } = await supabase
    .from("pacientes")
    .select("*")
    .order("created_at", { ascending: false });

  const nombreFarmacia =
    (user?.user_metadata?.nombre_farmacia as string | undefined) ?? "Mi farmacia";
  const email = user?.email ?? "";

  const total = pacientes?.length ?? 0;
  const porRecordar =
    pacientes?.filter((p) => {
      if (!p.proximo_recordatorio) return false;
      const dias = Math.ceil(
        (new Date(p.proximo_recordatorio).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      return dias <= 3;
    }).length ?? 0;

  return (
    <main className="min-h-screen bg-cream">
      {/* Top bar */}
      <header className="bg-white border-b border-forest/10">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} showTagline={false} />
            <span className="hidden sm:inline-block text-forest-ink/30">/</span>
            <span className="hidden sm:inline-block text-sm font-semibold text-forest-ink/70">
              Panel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-sm text-forest-ink/70">
              {email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-12">
        {/* Saludo */}
        <p className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
          <span className="text-accent">✓</span> Sesión activa
        </p>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-forest leading-tight">
          Hola, {nombreFarmacia}
        </h1>
        <p className="mt-3 text-lg text-forest-ink/75 max-w-2xl">
          Acá están tus pacientes crónicos y sus próximos recordatorios. PharmaTrack
          manda los mensajes sola — vos solo registrás al paciente una vez.
        </p>

        {/* Métricas rápidas */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricCard value={String(total)} label="Pacientes registrados" />
          <MetricCard value={String(porRecordar)} label="Por recordar esta semana" />
          <MetricCard value="Auto" label="Recordatorios programados" />
        </div>

        {/* Toolbar */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <h2 className="font-display font-bold text-2xl text-forest">
            Pacientes crónicos
          </h2>
          <RegistrarPacienteButton />
        </div>

        {/* Tabla / lista de pacientes */}
        {error ? (
          <div className="mt-6 rounded-card bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            Error cargando pacientes: {error.message}
            <br />
            <span className="text-xs">
              ¿Ejecutaste <code>supabase/schema.sql</code> en tu proyecto?
            </span>
          </div>
        ) : total === 0 ? (
          <div className="mt-6 bg-white rounded-card u-shadow-soft p-10 sm:p-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-cream flex items-center justify-center text-3xl mb-5">
              📋
            </div>
            <h2 className="font-display font-bold text-2xl text-forest">
              Sin pacientes registrados todavía
            </h2>
            <p className="mt-2 text-forest-ink/70 max-w-sm mx-auto">
              Cada vez que un cliente crónico llegue a comprar, registrá sus datos
              en menos de 1 minuto. PharmaTrack toma el control desde ahí.
            </p>
            <div className="mt-6 flex justify-center">
              <RegistrarPacienteButton />
            </div>
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-card u-shadow-soft overflow-hidden">
            {/* Encabezado desktop */}
            <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-cream/60 text-xs font-bold tracking-widest uppercase text-forest/60">
              <span>Paciente</span>
              <span>Tratamiento</span>
              <span>Canal</span>
              <span>Próximo</span>
              <span>Estado</span>
            </div>

            <ul className="divide-y divide-forest/8">
              {pacientes!.map((p) => {
                const est = estadoDe(p);
                const fechaFmt = p.proximo_recordatorio
                  ? new Date(p.proximo_recordatorio).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  : "—";
                return (
                  <li
                    key={p.id}
                    className="sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto] sm:gap-4 sm:items-center px-6 py-4 hover:bg-cream/40 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-forest-ink">
                        {p.nombre}
                      </div>
                      {p.telefono && (
                        <div className="text-xs text-forest-ink/55">
                          {p.telefono}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-forest-ink">
                        {p.tratamiento}
                      </div>
                      <div className="text-xs text-forest-ink/55">
                        {p.posologia}
                      </div>
                    </div>
                    <div className="text-sm text-forest-ink/70 mt-2 sm:mt-0">
                      {p.canal_pref === "whatsapp" ? "WhatsApp" : "Email"}
                    </div>
                    <div className="text-sm text-forest-ink/70 mt-2 sm:mt-0">
                      {fechaFmt}
                    </div>
                    <div className="mt-2 sm:mt-0 sm:text-right">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          est.tone === "warn"
                            ? "bg-accent/15 text-accent"
                            : est.tone === "ok"
                            ? "bg-forest/10 text-forest"
                            : "bg-forest/5 text-forest-ink/60"
                        }`}
                      >
                        {est.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Nota MVP */}
        <p className="mt-8 text-center text-xs text-forest-ink/50">
          PharmaTrack v0.1 (MVP) · El envío automático de WhatsApp/Email se
          conecta en el siguiente paso (Edge Function + Twilio).
        </p>
      </div>
    </main>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white rounded-card u-shadow-soft px-5 py-4">
      <div className="text-3xl font-extrabold text-forest leading-none">
        {value}
      </div>
      <div className="mt-1 text-xs text-forest-ink/60">{label}</div>
    </div>
  );
}

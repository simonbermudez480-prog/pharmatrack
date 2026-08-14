"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function RegistrarPacienteForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    canal_pref: "whatsapp" as "whatsapp" | "email",
    tratamiento: "",
    posologia: "",
    duracion_dias: "30",
    fecha_inicio: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) {
      setError("El nombre del paciente es obligatorio.");
      return;
    }
    if (form.canal_pref === "whatsapp" && !form.telefono.trim()) {
      setError("Para el canal WhatsApp necesitás el teléfono del paciente.");
      return;
    }
    if (form.canal_pref === "email" && !form.email.trim()) {
      setError("Para el canal Email necesitás el correo del paciente.");
      return;
    }
    const duracion = parseInt(form.duracion_dias, 10);
    if (isNaN(duracion) || duracion < 1) {
      setError("La duración del tratamiento debe ser mayor a 0 días.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión no válida. Volvé a iniciar sesión.");
      return;
    }

    const fechaInicio = form.fecha_inicio || new Date().toISOString().slice(0, 10);

    startTransition(async () => {
      const { error: insertError } = await supabase
        .from("pacientes")
        .insert({
          user_id: user.id,
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() || null,
          email: form.email.trim() || null,
          canal_pref: form.canal_pref,
          tratamiento: form.tratamiento.trim(),
          posologia: form.posologia.trim(),
          duracion_dias: duracion,
          fecha_inicio: fechaInicio,
          // proximo_recordatorio lo calcula automáticamente el trigger en Postgres
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección datos del paciente */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-bold tracking-widest uppercase text-forest/70 mb-2">
          Datos del paciente
        </legend>

        <FormField
          id="nombre"
          label="Nombre del paciente"
          required
          value={form.nombre}
          onChange={(v) => update("nombre", v)}
          placeholder="María Restrepo"
          autocomplete="name"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            id="telefono"
            label="Teléfono (WhatsApp)"
            type="tel"
            value={form.telefono}
            onChange={(v) => update("telefono", v)}
            placeholder="+57 300 123 4567"
            autocomplete="tel"
            hint="Formato internacional con +."
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="paciente@correo.co"
            autocomplete="email"
          />
        </div>

        {/* Canal preferido */}
        <div>
          <label className="block text-xs font-bold tracking-widest uppercase text-forest/70 mb-2">
            Canal de recordatorio
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["whatsapp", "email"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update("canal_pref", c)}
                className={`py-3 rounded-btn text-sm font-semibold transition-colors border ${
                  form.canal_pref === c
                    ? "bg-forest text-white border-forest"
                    : "bg-white text-forest border-forest/15 hover:border-forest/40"
                }`}
              >
                {c === "whatsapp" ? "WhatsApp" : "Email"}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Sección datos del tratamiento */}
      <fieldset className="space-y-4 pt-4 border-t border-forest/10">
        <legend className="text-xs font-bold tracking-widest uppercase text-forest/70 mb-2">
          Datos del tratamiento
        </legend>

        <FormField
          id="tratamiento"
          label="Tratamiento"
          required
          value={form.tratamiento}
          onChange={(v) => update("tratamiento", v)}
          placeholder="Losartán 50mg"
          hint="Nombre del medicamento y dosis."
        />

        <FormField
          id="posologia"
          label="Posología"
          required
          value={form.posologia}
          onChange={(v) => update("posologia", v)}
          placeholder="1 tableta cada 12 horas"
          hint="Frecuencia de toma. PharmaTrack usa este dato para el seguimiento del agente IA."
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            id="duracion_dias"
            label="Duración (días)"
            type="number"
            min={1}
            required
            value={form.duracion_dias}
            onChange={(v) => update("duracion_dias", v)}
            placeholder="30"
          />
          <FormField
            id="fecha_inicio"
            label="Fecha de inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={(v) => update("fecha_inicio", v)}
            hint="Por defecto: hoy."
          />
        </div>
      </fieldset>

      {error && (
        <div className="rounded-btn bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 h-12 rounded-btn bg-forest text-white font-bold hover:bg-forest-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Guardando…" : "Registrar paciente y programar recordatorios →"}
        </button>
        <Link
          href="/dashboard"
          className="flex-1 sm:flex-initial inline-flex items-center justify-center h-12 px-6 rounded-btn border border-forest/15 text-forest font-semibold hover:bg-forest/5 transition-colors"
        >
          Cancelar
        </Link>
      </div>

      <p className="text-xs text-forest-ink/55 leading-relaxed">
        PharmaTrack calculará sola cuándo recordar al paciente y le enviará el
        mensaje automáticamente cuando llegue el momento. Tú no tocás nada más.
      </p>
    </form>
  );
}

function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  autocomplete,
  hint,
  min,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  hint?: string;
  min?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold tracking-widest uppercase text-forest/70 mb-1.5"
      >
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        min={min}
        autoComplete={autocomplete}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-btn bg-cream border border-forest/10 text-forest-ink placeholder:text-forest-ink/40 focus:outline-none focus:border-forest focus:ring-2 focus:ring-accent/30 transition"
      />
      {hint && (
        <p className="mt-1.5 text-xs text-forest-ink/55">{hint}</p>
      )}
    </div>
  );
}

export default RegistrarPacienteForm;

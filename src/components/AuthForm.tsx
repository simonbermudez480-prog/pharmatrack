"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

type Mode = "login" | "registro";

export function AuthForm({initialMode = "login"}: {initialMode?: Mode}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreFarmacia, setNombreFarmacia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const supabase = createClient();

    startTransition(async () => {
      try {
        if (mode === "registro") {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { nombre_farmacia: nombreFarmacia || "Mi farmacia" },
            },
          });

          if (signUpError) throw signUpError;

          if (data.user && !data.session) {
            // Supabase requiere confirmación de email
            setInfo(
              "Te enviamos un correo de confirmación. Ábrelo y vuelve para iniciar sesión."
            );
            return;
          }

          router.push(redirect);
          router.refresh();
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword(
            { email, password }
          );

          if (signInError) throw signInError;

          router.push(redirect);
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salió mal.");
      }
    });
  }

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-card u-shadow-soft-lg p-8 sm:p-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="PharmaTrack inicio">
            <Logo size={40} showTagline={false} />
          </Link>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-btn bg-cream mb-8">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`py-2.5 rounded-btn text-sm font-semibold transition-colors ${
              isLogin
                ? "bg-forest text-white"
                : "text-forest/70 hover:text-forest"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode("registro")}
            className={`py-2.5 rounded-btn text-sm font-semibold transition-colors ${
              !isLogin
                ? "bg-forest text-white"
                : "text-forest/70 hover:text-forest"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Heading */}
        <h1 className="font-display font-extrabold text-3xl text-forest leading-tight">
          {isLogin ? "Bienvenido de nuevo." : "Empezá tus 2 semanas gratis."}
        </h1>
        <p className="mt-2 text-sm text-forest-ink/70">
          {isLogin
            ? "Entrá a tu panel para gestionar tus pacientes crónicos."
            : "Registá tu farmacia en menos de 1 minuto. Sin tarjeta de crédito."}
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {!isLogin && (
            <Field
              id="nombre_farmacia"
              label="Nombre de la farmacia"
              type="text"
              autoComplete="organization"
              value={nombreFarmacia}
              onChange={setNombreFarmacia}
              placeholder="Farmacia Central"
              required
            />
          )}
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            placeholder="gerente@miarmacia.co"
            required
          />
          <Field
            id="password"
            label="Contraseña"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 6 caracteres"
            required
          />

          {error && (
            <div className="rounded-btn bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-btn bg-forest/5 border border-forest/10 px-4 py-3 text-sm text-forest">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-btn bg-forest text-white font-bold hover:bg-forest-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {pending
              ? "Cargando…"
              : isLogin
              ? "Entrar →"
              : "Crear cuenta y empezar →"}
          </button>
        </form>

        {/* Switch */}
        <p className="mt-6 text-center text-sm text-forest-ink/70">
          {isLogin ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isLogin ? "registro" : "login")}
            className="font-semibold text-forest hover:underline"
            style={{ textDecorationColor: "var(--color-accent-soft)" }}
          >
            {isLogin ? "Crear cuenta gratis" : "Iniciar sesión"}
          </button>
        </p>

        <p className="mt-3 text-center text-xs text-forest-ink/50">
          Al continuar aceptás recibir recordatorios en nombre de tus
          pacientes. Cancelás cuando quieras.
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-forest-ink/55">
        <Link href="/" className="hover:text-forest transition-colors">
          ← Volver a pharmatrack.co
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold tracking-widest uppercase text-forest/70 mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-btn bg-cream border border-forest/10 text-forest-ink placeholder:text-forest-ink/40 focus:outline-none focus:border-forest focus:ring-2 focus:ring-accent/30 transition"
      />
    </div>
  );
}

export default AuthForm;

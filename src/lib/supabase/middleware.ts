import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware que:
 * 1. Refresca la sesión de Supabase en cada request (cookies actualizadas).
 * 2. Bloquea el acceso a /dashboard si no hay sesión -> redirige a /login.
 * 3. Redirige /login a /dashboard si ya hay sesión.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/registro";
  const isActivatedRoute = pathname.startsWith("/activar");

  // Logueado intentando entrar a /login -> va al dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // No logueado intentando entrar a /dashboard -> va a /login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Logueado entrando a /dashboard: verificar suscripción activa o trial vigente
  if (isProtected && user) {
    const { data: sub } = await supabase
      .from("suscripciones")
      .select("estado, fin_trial, fin_periodo")
      .eq("user_id", user.id)
      .maybeSingle();

    const ahora = new Date();

    let tieneAcceso = false;
    if (sub) {
      if (sub.estado === "activa") {
        // Activa: cubre mientras no tenga fin_periodo pasado
        tieneAcceso = !sub.fin_periodo || new Date(sub.fin_periodo) > ahora;
      } else if (sub.estado === "trial") {
        tieneAcceso = !sub.fin_trial || new Date(sub.fin_trial) > ahora;
      }
    }

    if (!tieneAcceso) {
      // Trial vencido o sin plan: redirige a /precios (a menos que ya venga del flow de activar)
      if (!isActivatedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/precios";
        url.searchParams.set("vencido", "1");
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

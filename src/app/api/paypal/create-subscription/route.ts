import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSubscription, PLAN_INFO } from "@/lib/paypal";
import type { PlanTier } from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { plan?: string };
    const planParam = body.plan as PlanTier | undefined;
    if (!planParam || !(planParam in PLAN_INFO)) {
      return NextResponse.json(
        { error: "Falta o es inválido el campo 'plan' (basic | pro | business)." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const origin = request.headers.get("origin") ?? "http://localhost:3000";
    const returnUrl = `${origin}/activar/exito`;
    const cancelUrl = `${origin}/activar/cancelado`;

    const { id, approveUrl } = await createSubscription(planParam, {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    });

    // Guardar suscripción pendiente en BD
    const supabaseAdmin = await createAdminClient();
    await supabaseAdmin.from("suscripciones").upsert({
      user_id: user.id,
      plan: planParam,
      estado: "pendiente",
      paypal_subscription_id: id,
      inicio_trial: null,
      fin_trial: null,
      inicio_suscripcion: null,
      fin_periodo: null,
    }, { onConflict: "user_id" });

    console.log("[paypal] Subscription created OK:", { id, approveUrl });

    return NextResponse.json({
      subscriptionId: id,
      approveUrl,
    });
  } catch (err) {
    console.error("[paypal] createSubscription error:", err instanceof Error ? err.message : err);
    const msg = err instanceof Error ? err.message : "Error interno.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
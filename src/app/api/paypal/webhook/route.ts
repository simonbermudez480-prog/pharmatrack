import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhook, getSubscription, PLAN_TIERS, type PlanTier } from "@/lib/paypal";

/**
 * Webhook de PayPal Subscriptions.
 * URL a configurar en PayPal Dashboard → My Apps → Webhooks:
 *   https://TU_DOMINIO/api/paypal/webhook
 * Eventos que procesamos:
 *   - BILLING.SUBSCRIPTION.ACTIVATED   -> marcar estado 'activa'
 *   - BILLING.SUBSCRIPTION.CANCELLED   -> marcar estado 'cancelada'
 *   - BILLING.SUBSCRIPTION.EXPIRED     -> marcar estado 'vencida'
 *   - PAYMENT.SALE.COMPLETED            -> actualizar fin_periodo
 *   - BILLING.SUBSCRIPTION.PAYMENT.FAILED -> marcar 'vencida'
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = request.headers;

  try {
    // 1) Verificar que el evento realmente vino de PayPal
    const verify = await verifyWebhook(headers, rawBody);
    if (verify.verification_status !== "SUCCESS") {
      console.warn("Webhook PayPal no verificado");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event_type: string;
      resource?: {
        id?: string; // subscription id
        plan_id?: string;
        status?: string;
        start_time?: string;
        billing_info?: {
          next_billing_time?: string;
          last_payment?: { time?: string };
        };
      };
    };

    const subscriptionId = event.resource?.id ?? "";
    if (!subscriptionId) {
      return NextResponse.json({ error: "Sin subscription id" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 2) Buscar la fila de suscripción por paypal_subscription_id
    const { data: existing } = await supabase
      .from("suscripciones")
      .select("id, user_id, plan, estado")
      .eq("paypal_subscription_id", subscriptionId)
      .maybeSingle();

    if (!existing) {
      console.warn("Webhook PayPal: subscriptionId no encontrado en BD:", subscriptionId);
      return NextResponse.json({ ok: true, msg: "ignorado" });
    }

    const patch: Record<string, string | null> = {
      ultimo_evento_paypal: event.event_type,
      ultimo_evento_en: new Date().toISOString(),
    };

    // 3) Mapear evento a estado
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        patch.estado = "activa";
        patch.inicio_suscripcion = new Date().toISOString();
        // Trae info real de PayPal para tener la próxima renovación
        try {
          const sub = await getSubscription(subscriptionId);
          if (sub.billing_info?.next_billing_time) {
            patch.fin_periodo = sub.billing_info.next_billing_time;
          }
          if (sub.subscriber?.email_address) {
            patch.paypal_email = sub.subscriber.email_address;
          }
          patch.paypal_plan_id = sub.plan_id;
          const tier = PLAN_TIERS.find((t) =>
            process.env[`PAYPAL_PLAN_${t.toUpperCase()}`] === sub.plan_id
          ) as PlanTier | undefined;
          if (tier) patch.plan = tier;
        } catch (e) {
          console.warn("No se pudo obtener detalle de sub de PayPal:", e);
        }
        break;
      }
      case "BILLING.SUBSCRIPTION.CANCELLED":
        patch.estado = "cancelada";
        break;
      case "BILLING.SUBSCRIPTION.EXPIRED":
        patch.estado = "vencida";
        break;
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        patch.estado = "vencida";
        break;
      case "PAYMENT.SALE.COMPLETED": {
        // Renovación exitosa: actualizar fin_periodo consultando a PayPal
        try {
          const sub = await getSubscription(subscriptionId);
          if (sub.billing_info?.next_billing_time) {
            patch.fin_periodo = sub.billing_info.next_billing_time;
            patch.estado = "activa";
          }
        } catch (e) {
          console.warn("No se pudo actualizar renovación:", e);
        }
        break;
      }
    }

    // 4) Persistir actualización
    const { error } = await supabase
      .from("suscripciones")
      .update(patch)
      .eq("id", existing.id);

    if (error) {
      console.error("Error actualizando suscripción:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}

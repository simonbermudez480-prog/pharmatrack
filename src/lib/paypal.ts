/**
 * Helpers backend para PayPal REST API (Subscriptions).
 * Solo se usan del lado del servidor (Route Handlers / Server Actions).
 *
 * Documentación oficial:
 *   https://developer.paypal.com/docs/api/subscriptions/v1/
 */

export type PlanTier = "basic" | "pro" | "business";

const PLAN_ENV_MAP: Record<PlanTier, "PAYPAL_PLAN_BASIC" | "PAYPAL_PLAN_PRO" | "PAYPAL_PLAN_BUSINESS"> = {
  basic: "PAYPAL_PLAN_BASIC",
  pro: "PAYPAL_PLAN_PRO",
  business: "PAYPAL_PLAN_BUSINESS",
};

// Planes de PharmaTrack (espejo del Plan ID de PayPal)
export const PLAN_INFO: Record<PlanTier, { name: string; price: number; limite: string }> = {
  basic: { name: "Basic", price: 29, limite: "100 pacientes" },
  pro: { name: "Pro", price: 59, limite: "250 pacientes" },
  business: { name: "Business", price: 99, limite: "Ilimitados" },
};

function baseUrl(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/** Obtiene el access token de PayPal (client credentials). */
export async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error("Faltan PAYPAL_CLIENT_ID o PAYPAL_SECRET en .env.local");
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${txt}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Devuelve el PLAN_ID de PayPal para un tier dado. */
export function getPlanIdForTier(tier: PlanTier): string {
  const envVar = PLAN_ENV_MAP[tier];
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Falta ${envVar} en .env.local. Creá el plan en PayPal Dashboard → Billing → Plans.`);
  }
  return value;
}

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  plan_id: string;
  start_time?: string;
  subscriber?: {
    email_address?: string;
  };
}

/** Crea una suscripción en PayPal para el plan del tier. */
export async function createSubscription(
  tier: PlanTier,
  applicationContext: { return_url: string; cancel_url: string }
): Promise<{ id: string; approveUrl: string | null }> {
  const token = await getAccessToken();
  const planId = getPlanIdForTier(tier);

  const body = {
    plan_id: planId,
    application_context: {
      brand_name: "PharmaTrack",
      locale: "es-CO",
      user_action: "SUBSCRIBE_NOW",
      shipping_preference: "NO_SHIPPING",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
      },
      return_url: applicationContext.return_url,
      cancel_url: applicationContext.cancel_url,
    },
  };

  const res = await fetch(`${baseUrl()}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal createSubscription failed: ${res.status} ${txt}`);
  }
  const data = (await res.json()) as PayPalSubscriptionResponse & {
    links?: { href: string; rel: string }[];
  };
  const approveLink = data.links?.find((l) => l.rel === "approve") ?? null;
  return { id: data.id, approveUrl: approveLink?.href ?? null };
}

/** Trae los datos completos de una suscripción desde PayPal. */
export async function getSubscription(
  subscriptionId: string
): Promise<PayPalSubscriptionResponse & {
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string };
  };
}> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal getSubscription failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/** Cancela una suscripción en PayPal. */
export async function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal cancelSubscription failed: ${res.status} ${txt}`);
  }
}

/** Verifica que un webhook event sea legítimo (de PayPal y no forjado). */
export async function verifyWebhook(
  headers: Headers,
  rawBody: string
): Promise<{ verification_status: string }> {
  const token = await getAccessToken();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("Falta PAYPAL_WEBHOOK_ID");
  }

  const transmissionId = headers.get("paypal-transmission-id") ?? "";
  const transmissionTime = headers.get("paypal-transmission-time") ?? "";
  const certUrl = headers.get("paypal-cert-url") ?? "";
  const authAlgo = headers.get("paypal-auth-algo") ?? "";
  const authSig = headers.get("paypal-auth-signature") ?? "";

  const res = await fetch(`${baseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: authSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal verifyWebhook failed: ${res.status} ${txt}`);
  }
  const data = (await res.json()) as { verification_status: string };
  return data;
}

export const PLAN_TIERS: PlanTier[] = ["basic", "pro", "business"];

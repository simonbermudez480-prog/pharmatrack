"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { PlanTier } from "@/lib/paypal";
import { PLAN_INFO } from "@/lib/paypal";

interface Props {
  tier: PlanTier;
}

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "test";

export function SubscriptionButton({ tier }: Props) {
  return (
    <PayPalScriptProvider
      options={{
        clientId,
        intent: "subscription",
        vault: true,
        currency: "USD",
      }}
    >
      <SubscriptionButtonInner tier={tier} />
    </PayPalScriptProvider>
  );
}

function SubscriptionButtonInner({ tier }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [, startTransition] = useTransition();
  const plan = PLAN_INFO[tier];

  async function createSubscription() {
    setError(null);
    setInfo("Conectando con PayPal…");
    console.log("[paypal] createSubscription called for tier:", tier);

    try {
      const res = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tier }),
      });

      console.log("[paypal] API response status:", res.status);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `No se pudo iniciar la suscripción (${res.status}).`);
      }

      const data = (await res.json()) as { subscriptionId: string };
      console.log("[paypal] Got subscriptionId:", data.subscriptionId);
      setInfo(null);
      return data.subscriptionId;
    } catch (err) {
      console.error("[paypal] createSubscription error:", err);
      setInfo(null);
      throw err;
    }
  }

  async function onApprove(data: unknown) {
    console.log("[paypal] onApprove fired:", data);
    setPaying(true);
    setInfo("Confirmado. Redirigiendo…");

    try {
      // Esperamos 2-3s a que PayPal dispare el webhook ACTIVATED
      await new Promise((r) => setTimeout(r, 2500));
      startTransition(() => {
        router.push("/activar/exito");
        router.refresh();
      });
    } catch (err) {
      console.error("[paypal] onApprove error:", err);
      setPaying(false);
      setError("Pago aprobado pero no pudimos redirigir. Volvé al panel.");
    }
  }

  function onError(err: unknown) {
    console.error("[paypal] PayPal button onError:", err);
    setInfo(null);
    setError(err instanceof Error ? err.message : "Error procesando PayPal.");
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-btn bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-3 rounded-btn bg-forest/5 border border-forest/10 px-4 py-3 text-sm text-forest">
          {info}
        </div>
      )}

      {paying ? (
        <div className="h-[114px] flex items-center justify-center rounded-btn bg-forest/5 text-sm text-forest-ink/60">
          Pago confirmado. Activando tu plan…
        </div>
      ) : (
        <PayPalButtons
          style={{
            layout: "vertical",
            shape: "rect",
            color: "white",
            label: "subscribe",
          }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={onError}
          forceReRender={[tier]}
        />
      )}

      <p className="mt-3 text-xs text-forest-ink/55 text-center">
        Autorizás el cargo mensual de ${plan.price} USD una vez. PayPal cobra
        solo cada período.
      </p>
      <p className="mt-1 text-xs text-forest-ink/40 text-center">
        Si no abre el pop-up, revisá el bloqueador de ventanas emergentes de tu
        navegador.
      </p>
    </div>
  );
}

export default SubscriptionButton;

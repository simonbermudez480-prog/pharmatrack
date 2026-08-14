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
  const [pending, startTransition] = useTransition();
  const plan = PLAN_INFO[tier];

  async function createSubscription() {
    setError(null);
    // Llamada a NUESTRA API que crea la sub en PayPal del lado seguro
    const res = await fetch("/api/paypal/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: tier }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "No se pudo iniciar la suscripción.");
    }
    const data = (await res.json()) as { subscriptionId: string };
    return data.subscriptionId;
  }

  function onApprove() {
    // PayPal ya redirige a /activar/exito — acá solo refrescamos.
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          // Esperamos un par de segundos a que PayPal dispare ACTIVATED.
          await new Promise((r) => setTimeout(r, 2500));
          router.push("/activar/exito");
          router.refresh();
        } finally {
          resolve();
        }
      });
    });
  }

  function onError(err: unknown) {
    setError(err instanceof Error ? err.message : "Error procesando PayPal.");
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-btn bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {pending ? (
        <div className="h-[114px] flex items-center justify-center rounded-btn bg-forest/5 text-sm text-forest-ink/60">
          Activando suscripción…
        </div>
      ) : (
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", color: "white", label: "subscribe" }}
          createSubscription={createSubscription}
          onApprove={() => onApprove()}
          onError={onError}
        />
      )}

      <p className="mt-3 text-xs text-forest-ink/55 text-center">
        Autorizás el cargo mensual de ${plan.price} USD una vez. PayPal cobra solo
        cada período.
      </p>
    </div>
  );
}

export default SubscriptionButton;

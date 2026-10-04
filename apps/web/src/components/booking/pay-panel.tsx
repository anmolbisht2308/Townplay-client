"use client";

import {
  formatPaise,
  orderResponseSchema,
  paymentResultSchema,
  paymentsConfigSchema,
  type OrderResponse,
} from "@townplay/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { api } from "@/lib/api";
import { openCheckout } from "@/lib/razorpay";

type Target =
  | { bookingId: string }
  | { ticketOrderId: string }
  | { shareId: string }
  | { membershipId: string };

/**
 * Pays a held booking, ticket order, share or membership. Razorpay Checkout in production; in test mode (fake
 * provider) the buttons simulate success or failure. The webhook confirms either way and the
 * parent polls, so closing Checkout early is fine; `onPaid` just refreshes sooner.
 */
export function PayPanel({
  target,
  amountPaise,
  description,
  phone,
  onPaid,
  createOrder,
}: {
  target: Target;
  /** Custom order step (split-payment links create the order through their token). */
  createOrder?: () => Promise<OrderResponse>;
  amountPaise: number;
  description: string;
  phone?: string;
  onPaid: () => void;
}) {
  const t = useTranslations("bookings");
  const me = useMe();
  const [failed, setFailed] = useState(false);
  const config = useQuery({
    queryKey: ["payments-config"],
    queryFn: () => api.get("/payments/config", paymentsConfigSchema),
    staleTime: 5 * 60_000,
  });

  const order = useMutation({
    mutationFn: () =>
      createOrder
        ? createOrder()
        : api.send("POST", "/payments/orders", orderResponseSchema, target),
  });

  const fakePay = useMutation({
    mutationFn: async (outcome: "success" | "failure") => {
      const o = order.data ?? (await order.mutateAsync());
      if (o.result) return o.result;
      return api.send("POST", "/payments/fake-pay", paymentResultSchema, {
        orderId: o.orderId,
        outcome,
      });
    },
    onSuccess: (r) => {
      setFailed(r.status === "pending_payment");
      onPaid();
    },
  });

  const razorpay = useMutation({
    mutationFn: async () => {
      setFailed(false);
      const o = await order.mutateAsync();
      if (o.result) return onPaid(); // nothing to pay online
      await openCheckout({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amountPaise,
        currency: "INR",
        name: "Townplay",
        description,
        prefill: {
          ...(me.data?.name ? { name: me.data.name } : {}),
          ...(me.data?.email ? { email: me.data.email } : {}),
          ...(phone ? { contact: `+91${phone}` } : {}),
        },
        theme: { color: "#15803d" },
        onFailed: () => setFailed(true),
        handler: (r) => {
          void api
            .send("POST", "/payments/verify", paymentResultSchema, {
              razorpayOrderId: r.razorpay_order_id,
              razorpayPaymentId: r.razorpay_payment_id,
              razorpaySignature: r.razorpay_signature,
            })
            .then(onPaid);
        },
      });
    },
  });

  const testMode = config.data?.provider === "fake";
  const busy = order.isPending || fakePay.isPending || razorpay.isPending;

  return (
    <div className="space-y-2">
      {config.isPending ? null : !testMode ? (
        <Button size="lg" className="w-full" disabled={busy} onClick={() => razorpay.mutate()}>
          {busy ? t("paying") : t("pay", { amount: formatPaise(amountPaise) })}
        </Button>
      ) : (
        <>
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => fakePay.mutate("success")}
          >
            {t("payTest", { amount: formatPaise(amountPaise) })}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => fakePay.mutate("failure")}
          >
            {t("failTest")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("devNote")}</p>
        </>
      )}
      {failed && <p className="text-sm text-destructive">{t("paymentFailed")}</p>}
      <FormError error={order.error ?? fakePay.error ?? razorpay.error} labels={{}} />
    </div>
  );
}

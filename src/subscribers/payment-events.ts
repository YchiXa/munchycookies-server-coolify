import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("💳 Payment events subscriber loaded");

export default async function paymentEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const orderId = data.order_id || data.id;
  if (!orderId) {
    console.warn("payment event: no order ID in event data");
    return;
  }
  await triggerPaymentRevalidate(orderId);
}

async function triggerPaymentRevalidate(orderId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = [`order-${orderId}`, "checkout"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for payment:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Payment revalidation successful for:`, orderId);
  } catch (err) {
    console.error("payment revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: ["payment.captured", "payment.refunded"],
};

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🔔 Order revalidate subscriber loaded");

export default async function orderRevalidateHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id;
  if (!orderId) {
    console.warn("order revalidate: no order ID in event data");
    return;
  }
  await triggerOrderRevalidate(orderId);
}

async function triggerOrderRevalidate(orderId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = ["order-" + orderId, "checkout"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for order:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Order revalidation successful for:`, orderId);
  } catch (err) {
    console.error("order revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "order.updated",
    "order.payment_updated",
    "order.completed",
    "order.canceled",
    "order.payment_captured",
    "order.payment_refunded",
    "order.payment_canceled",
  ],
};

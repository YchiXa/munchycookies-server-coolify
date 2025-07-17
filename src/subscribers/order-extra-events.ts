import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🧾 Order extra events subscriber loaded");

export default async function orderExtraEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id;
  if (!orderId) {
    console.warn("order extra event: no order ID in event data");
    return;
  }
  await triggerOrderRevalidate(orderId);
}

async function triggerOrderRevalidate(orderId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = [`order-${orderId}`, "checkout"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for order extra:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Order extra revalidation successful for:`, orderId);
  } catch (err) {
    console.error("order extra revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "order.placed",
    "order.archived",
    "order.fulfillment_created",
    "order.fulfillment_canceled",
    "order.return_requested",
    "order.return_received",
    "order.claim_created",
    "order.exchange_created",
    "order.transfer_requested",
  ],
};

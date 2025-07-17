import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("✏️ Order edit events subscriber loaded");

export default async function orderEditEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const orderEditId = data.id;
  if (!orderEditId) {
    console.warn("order-edit event: no order ID in event data");
    return;
  }
  await triggerOrderEditRevalidate(orderEditId);
}

async function triggerOrderEditRevalidate(orderId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = [`order-${orderId}`, "checkout"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for order-edit:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Order-edit revalidation successful for:`, orderId);
  } catch (err) {
    console.error("order-edit revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "order-edit.requested",
    "order-edit.confirmed",
    "order-edit.canceled",
  ],
};

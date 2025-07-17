import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🚚 Shipment/Delivery events subscriber loaded");

export default async function shipmentEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const orderId = data.order_id || data.id;
  if (!orderId) {
    console.warn("shipment/delivery event: no order ID in event data");
    return;
  }
  await triggerShipmentRevalidate(orderId);
}

async function triggerShipmentRevalidate(orderId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = [`order-${orderId}`, "checkout"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for shipment/delivery:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Shipment/Delivery revalidation successful for:`, orderId);
  } catch (err) {
    console.error("shipment/delivery revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: ["shipment.created", "delivery.created"],
};

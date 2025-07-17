import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🛒 Cart events subscriber loaded");

export default async function cartEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const cartId = data.id;
  if (!cartId) {
    console.warn("cart event: no cart ID in event data");
    return;
  }
  await triggerCartRevalidate(cartId);
}

async function triggerCartRevalidate(cartId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = ["checkout"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for cart:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Cart revalidation successful for:`, cartId);
  } catch (err) {
    console.error("cart revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "cart.created",
    "cart.updated",
    "cart.region_updated",
    "cart.customer_transferred",
  ],
};

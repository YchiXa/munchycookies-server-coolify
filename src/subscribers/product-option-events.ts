import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🧩 Product option events subscriber loaded");

export default async function productOptionEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; product_id?: string }>) {
  const productId = data.product_id || data.id;
  if (!productId) {
    console.warn("product-option event: no product ID in event data");
    return;
  }
  await triggerProductOptionRevalidate(productId);
}

async function triggerProductOptionRevalidate(productId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = ["general", "products"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for product-option:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Product option revalidation successful for:`, productId);
  } catch (err) {
    console.error("product-option revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "product-option.created",
    "product-option.updated",
    "product-option.deleted",
  ],
};

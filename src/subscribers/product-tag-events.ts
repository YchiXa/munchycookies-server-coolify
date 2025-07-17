import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🔖 Product tag events subscriber loaded");

export default async function productTagEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const tagId = data.id;
  if (!tagId) {
    console.warn("product-tag event: no tag ID in event data");
    return;
  }
  await triggerProductTagRevalidate(tagId);
}

async function triggerProductTagRevalidate(tagId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = ["general", "products"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for product-tag:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Product tag revalidation successful for:`, tagId);
  } catch (err) {
    console.error("product-tag revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: ["product-tag.created", "product-tag.updated", "product-tag.deleted"],
};

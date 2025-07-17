import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("💼 Product type events subscriber loaded");

export default async function productTypeEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const typeId = data.id;
  if (!typeId) {
    console.warn("product-type event: no type ID in event data");
    return;
  }
  await triggerProductTypeRevalidate(typeId);
}

async function triggerProductTypeRevalidate(typeId: string) {
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";
  const tags = ["general", "products"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;
  console.log("→ calling revalidate endpoint for product-type:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Product type revalidation successful for:`, typeId);
  } catch (err) {
    console.error("product-type revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "product-type.created",
    "product-type.updated",
    "product-type.deleted",
  ],
};

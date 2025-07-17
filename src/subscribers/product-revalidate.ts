// src/subscribers/product-revalidate.ts

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

// Проверяем загрузку переменных окружения
console.log("🔧 Environment variables check:");
console.log("  - MEDUSA_BACKEND_URL:", process.env.MEDUSA_BACKEND_URL);
console.log(
  "  - MEDUSA_ADMIN_API_KEY:",
  process.env.MEDUSA_ADMIN_API_KEY ? "SET" : "NOT SET"
);
console.log("  - STOREFRONT_URL:", process.env.STOREFRONT_URL);
console.log(
  "  - REVALIDATE_SECRET:",
  process.env.REVALIDATE_SECRET ? "SET" : "NOT SET"
);
console.log(
  "  - NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:",
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ? "SET" : "NOT SET"
);
console.log("  - DEFAULT_COUNTRY_CODE:", process.env.DEFAULT_COUNTRY_CODE);

console.log("🔍 Product revalidate subscriber loaded");

export default async function productRevalidateHandler({
  event: { data },
}: SubscriberArgs<{ id: string; handle?: string }>) {
  const productId = data.id;
  const handle = data.handle;

  if (!productId) {
    console.warn("product revalidate: no product ID in event data");
    return;
  }

  console.log("🔍 Debug info:");
  console.log("  - productId:", productId);
  console.log("  - handle from event:", handle);

  // Если handle есть в событии, используем его
  if (handle) {
    console.log("✅ Using handle from event:", handle);
    await triggerRevalidate(handle);
    return;
  }

  // Если handle нет в событии, попробуем получить через Store API
  console.log("⚠️ Handle not in event, trying Store API...");

  const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL!;
  const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  console.log("  - MEDUSA_BACKEND_URL:", MEDUSA_BACKEND_URL);
  console.log(
    "  - PUBLISHABLE_API_KEY:",
    PUBLISHABLE_API_KEY
      ? `${PUBLISHABLE_API_KEY.substring(0, 10)}...`
      : "undefined"
  );

  try {
    const url = `${MEDUSA_BACKEND_URL}/store/products/${productId}`;
    console.log("  - Requesting URL:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    });

    console.log("  - Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.log("  - Error response body:", errorText);
      throw new Error(`Store API ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const apiHandle = json.product.handle;

    if (!apiHandle) {
      throw new Error("Product handle not found");
    }

    console.log("  - Successfully got handle from Store API:", apiHandle);
    await triggerRevalidate(apiHandle);
  } catch (err) {
    console.error("product revalidate: failed to fetch handle:", err);
    console.log("⚠️ Skipping revalidation for product:", productId);
  }
}

async function triggerRevalidate(handle: string) {
  console.log("🔔 product revalidate for:", handle);

  // Формируем запрос на Storefront
  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  const tags = ["products", `product-${handle}`].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log("✅ Revalidation successful for:", handle);
  } catch (err) {
    console.error("product revalidate: revalidate call failed", err);
  }
}

export const config: SubscriberConfig = {
  // слушаем и создание, и обновление
  event: ["product.created", "product.updated"],
};

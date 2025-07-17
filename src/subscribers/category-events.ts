import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("📂 Category events subscriber loaded");

export default async function categoryEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; handle?: string }>) {
  const categoryId = data.id;
  const handle = data.handle;

  if (!categoryId) {
    console.warn("category revalidate: no category ID in event data");
    return;
  }

  console.log(`📂 Category revalidate for:`, categoryId);

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

  try {
    const url = `${MEDUSA_BACKEND_URL}/store/product-categories/${categoryId}`;
    console.log("  - Requesting URL:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    });

    if (!res.ok) {
      // Если сущность не найдена (удалена), ревалидируем общий список категорий
      if (res.status === 404) {
        console.log(
          "  - Category not found (deleted), revalidating categories list"
        );
        await triggerGeneralRevalidate();
        return;
      }
      throw new Error(`Store API ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    console.log("  - Store API response:", JSON.stringify(json, null, 2));

    // Если ответ пустой (категория удалена), ревалидируем общий список
    if (!json || Object.keys(json).length === 0) {
      console.log(
        "  - Category deleted (empty response), revalidating categories list"
      );
      await triggerGeneralRevalidate();
      return;
    }

    const apiHandle = json.product_category?.handle || json.handle;

    if (!apiHandle) {
      throw new Error("Category handle not found");
    }

    console.log("  - Successfully got handle from Store API:", apiHandle);
    await triggerRevalidate(apiHandle);
  } catch (err) {
    console.error("category revalidate: failed to fetch handle:", err);
    console.log("⚠️ Skipping revalidation for category:", categoryId);
  }
}

async function triggerRevalidate(handle: string) {
  console.log(`🔔 category revalidate for:`, handle);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Для категорий ревалидируем список категорий и страницу категории
  const tags = ["categories", `category-${handle}`].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Revalidation successful for category:`, handle);
  } catch (err) {
    console.error(`category revalidate: revalidate call failed`, err);
  }
}

async function triggerGeneralRevalidate() {
  console.log(`🔔 category general revalidate`);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Ревалидируем только список категорий
  const tags = ["categories"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ General revalidation successful for categories`);
  } catch (err) {
    console.error(`category general revalidate: revalidate call failed`, err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "product-category.created",
    "product-category.updated",
    "product-category.deleted",
  ],
};

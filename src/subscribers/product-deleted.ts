import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🗑️ Product deleted subscriber loaded");

export default async function productDeletedHandler({
  event: { data },
}: SubscriberArgs<{ id: string; handle?: string }>) {
  const productId = data.id;
  const handle = data.handle;

  if (!productId) {
    console.warn("product deleted revalidate: no product ID in event data");
    return;
  }

  console.log("🗑️ Product deleted revalidate for:", productId);

  // Если handle есть в событии, используем его
  if (handle) {
    console.log("✅ Using handle from event:", handle);
    await triggerRevalidate(handle, "deleted");
    return;
  }

  // Если handle нет в событии, попробуем получить через Store API
  console.log("⚠️ Handle not in event, trying Store API...");

  const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL!;
  const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  try {
    const url = `${MEDUSA_BACKEND_URL}/store/products/${productId}`;
    console.log("  - Requesting URL:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    });

    if (!res.ok) {
      // Если сущность не найдена (удалена), ревалидируем общий список продуктов
      if (res.status === 404) {
        console.log(
          "  - Product not found (deleted), revalidating products list"
        );
        await triggerGeneralRevalidate();
        return;
      }
      throw new Error(`Store API ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    console.log("  - Store API response:", JSON.stringify(json, null, 2));

    // Если ответ пустой (продукт удален), ревалидируем общий список
    if (!json || Object.keys(json).length === 0) {
      console.log(
        "  - Product deleted (empty response), revalidating products list"
      );
      await triggerGeneralRevalidate();
      return;
    }

    const apiHandle = json.product.handle;

    if (!apiHandle) {
      throw new Error("Product handle not found");
    }

    console.log("  - Successfully got handle from Store API:", apiHandle);
    await triggerRevalidate(apiHandle, "deleted");
  } catch (err) {
    console.error("product deleted revalidate: failed to fetch handle:", err);
    console.log("⚠️ Skipping revalidation for deleted product:", productId);
  }
}

async function triggerRevalidate(handle: string, action: string) {
  console.log(`🔔 product ${action} revalidate for:`, handle);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Для удаления товара ревалидируем список товаров и страницу товара
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
    console.log(`✅ Revalidation successful for ${action} product:`, handle);
  } catch (err) {
    console.error(`product ${action} revalidate: revalidate call failed`, err);
  }
}

async function triggerGeneralRevalidate() {
  console.log(`🔔 product general revalidate`);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Ревалидируем только список продуктов
  const tags = ["products"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ General revalidation successful for products`);
  } catch (err) {
    console.error(`product general revalidate: revalidate call failed`, err);
  }
}

export const config: SubscriberConfig = {
  event: ["product.deleted"],
};

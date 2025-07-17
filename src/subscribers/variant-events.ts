import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🔧 Variant events subscriber loaded");

// Дебаунсинг для предотвращения частых ревалидаций
const variantRevalidationQueue = new Map<string, NodeJS.Timeout>();

// Дебаунсинг функция для предотвращения частых ревалидаций
function debouncedVariantRevalidate(
  key: string,
  callback: () => Promise<void>,
  delay: number = 1500
) {
  // Очищаем предыдущий таймер
  if (variantRevalidationQueue.has(key)) {
    clearTimeout(variantRevalidationQueue.get(key)!);
  }

  // Устанавливаем новый таймер
  const timeout = setTimeout(async () => {
    await callback();
    variantRevalidationQueue.delete(key);
  }, delay);

  variantRevalidationQueue.set(key, timeout);
}

export default async function variantEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; product_id?: string }>) {
  const variantId = data.id;
  const productId = data.product_id;

  if (!variantId) {
    console.warn("variant revalidate: no variant ID in event data");
    return;
  }

  console.log(`🔧 Variant revalidate for:`, variantId);

  // Если есть product_id, получаем handle товара и ревалидируем его страницу
  if (productId) {
    debouncedVariantRevalidate(`product-${productId}`, () =>
      revalidateProduct(productId)
    );
    return;
  }

  // Если product_id нет в событии, попробуем получить через Store API
  console.log("⚠️ No product_id in variant event, trying Store API...");
  debouncedVariantRevalidate(`variant-${variantId}`, () =>
    revalidateVariant(variantId)
  );
}

async function revalidateProduct(productId: string) {
  const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL!;
  const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  try {
    const url = `${MEDUSA_BACKEND_URL}/store/products/${productId}`;
    console.log("  - Requesting product URL:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`Store API ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const handle = json.product.handle;

    if (!handle) {
      throw new Error("Product handle not found");
    }

    console.log("  - Successfully got product handle:", handle);
    await triggerRevalidate(handle);
  } catch (err) {
    console.error("variant revalidate: failed to fetch product handle:", err);
  }
}

async function revalidateVariant(variantId: string) {
  const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL!;
  const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  try {
    const url = `${MEDUSA_BACKEND_URL}/store/product-variants/${variantId}`;
    console.log("  - Requesting variant URL:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`Store API ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const productId = json.product_variant?.product_id;

    if (!productId) {
      throw new Error("Product ID not found in variant");
    }

    console.log("  - Successfully got product ID from variant:", productId);
    await revalidateProduct(productId);
  } catch (err) {
    console.error("variant revalidate: failed to fetch variant:", err);
  }
}

async function triggerRevalidate(handle: string) {
  console.log(`🔔 variant revalidate for product:`, handle);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Для вариантов ревалидируем страницу товара и общие страницы
  const tags = [`product-${handle}`, "general", "products"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Revalidation successful for variant of product:`, handle);
  } catch (err) {
    console.error(`variant revalidate: revalidate call failed`, err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
  ],
};

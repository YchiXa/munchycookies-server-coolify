import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("💰 Price events subscriber loaded");

// Дебаунсинг для предотвращения частых ревалидаций
const revalidationQueue = new Map<string, NodeJS.Timeout>();

async function triggerRevalidate(handle: string) {
  console.log(`🔔 price revalidate for product:`, handle);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Для изменений цен ревалидируем страницу товара и общие страницы
  const tags = [`product-${handle}`, "general"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Price revalidation successful for product:`, handle);
  } catch (err) {
    console.error(`price revalidate: revalidate call failed`, err);
  }
}

async function triggerGeneralRevalidate() {
  console.log(`🔔 price general revalidate`);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Ревалидируем все страницы для общих ценовых изменений
  const tags = ["general", "products", "collections", "categories"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ General price revalidation successful`);
  } catch (err) {
    console.error(`price general revalidate: revalidate call failed`, err);
  }
}

// Дебаунсинг функция для предотвращения частых ревалидаций
function debouncedRevalidate(
  key: string,
  callback: () => Promise<void>,
  delay: number = 2000
) {
  // Очищаем предыдущий таймер
  if (revalidationQueue.has(key)) {
    clearTimeout(revalidationQueue.get(key)!);
  }

  // Устанавливаем новый таймер
  const timeout = setTimeout(async () => {
    await callback();
    revalidationQueue.delete(key);
  }, delay);

  revalidationQueue.set(key, timeout);
}

export default async function priceEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; product_id?: string; variant_id?: string }>) {
  const entityId = data.id;
  const productId = data.product_id;
  const variantId = data.variant_id;

  console.log(`💰 Price event for entity:`, entityId);

  // Если есть product_id, ревалидируем страницу товара
  if (productId) {
    debouncedRevalidate(`product-${productId}`, () =>
      revalidateProduct(productId)
    );
    return;
  }

  // Если есть variant_id, получаем product_id и ревалидируем
  if (variantId) {
    debouncedRevalidate(`variant-${variantId}`, () =>
      revalidateVariant(variantId)
    );
    return;
  }

  // Для общих ценовых изменений ревалидируем все страницы
  console.log("💰 General price change, revalidating all pages");
  debouncedRevalidate("general-price", () => triggerGeneralRevalidate());
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
    console.error("price revalidate: failed to fetch product handle:", err);
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
    console.error("price revalidate: failed to fetch variant:", err);
  }
}

export const config: SubscriberConfig = {
  event: [
    // События цен вариантов
    "product-variant-price.created",
    "product-variant-price.updated",
    "product-variant-price.deleted",

    // События вариантов (включают изменения цен)
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",

    // События прайс-листов
    "price-list.created",
    "price-list.updated",
    "price-list.deleted",

    // События цен прайс-листов
    "price-list-price.created",
    "price-list-price.updated",
    "price-list-price.deleted",

    // События скидок
    "discount.created",
    "discount.updated",
    "discount.deleted",

    // События подарочных карт
    "gift-card.created",
    "gift-card.updated",
    "gift-card.deleted",

    // События валют
    "currency.created",
    "currency.updated",
    "currency.deleted",

    // События регионов (могут влиять на цены)
    "region.created",
    "region.updated",
    "region.deleted",
  ],
};

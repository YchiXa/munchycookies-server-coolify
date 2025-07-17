import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🚚 Shipping events subscriber loaded");

// Дебаунсинг для предотвращения частых ревалидаций
const shippingRevalidationQueue = new Map<string, NodeJS.Timeout>();

// Дебаунсинг функция для предотвращения частых ревалидаций
function debouncedShippingRevalidate(
  key: string,
  callback: () => Promise<void>,
  delay: number = 3000
) {
  // Очищаем предыдущий таймер
  if (shippingRevalidationQueue.has(key)) {
    clearTimeout(shippingRevalidationQueue.get(key)!);
  }

  // Устанавливаем новый таймер
  const timeout = setTimeout(async () => {
    await callback();
    shippingRevalidationQueue.delete(key);
  }, delay);

  shippingRevalidationQueue.set(key, timeout);
}

export default async function shippingEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const entityId = data.id;

  console.log(`🚚 Shipping event for entity:`, entityId);

  // Для изменений в доставке ревалидируем все страницы, особенно checkout
  debouncedShippingRevalidate("shipping", () => triggerShippingRevalidate());
}

async function triggerShippingRevalidate() {
  console.log(`🔔 shipping revalidate`);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Ревалидируем все страницы, особенно checkout
  const tags = ["general", "checkout"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Shipping revalidation successful`);
  } catch (err) {
    console.error(`shipping revalidate: revalidate call failed`, err);
  }
}

export const config: SubscriberConfig = {
  event: [
    // События опций доставки
    "shipping-option.created",
    "shipping-option.updated",
    "shipping-option.deleted",

    // События профилей доставки
    "shipping-profile.created",
    "shipping-profile.updated",
    "shipping-profile.deleted",

    // События зон доставки
    "service-zone.created",
    "service-zone.updated",
    "service-zone.deleted",

    // События гео-зон
    "geo-zone.created",
    "geo-zone.updated",
    "geo-zone.deleted",

    // События fulfillment
    "fulfillment-set.created",
    "fulfillment-set.updated",
    "fulfillment-set.deleted",

    // События fulfillment провайдеров
    "fulfillment-provider.created",
    "fulfillment-provider.updated",
    "fulfillment-provider.deleted",
  ],
};

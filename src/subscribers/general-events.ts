import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🔄 General events subscriber loaded");

export default async function generalEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const entityId = data.id;

  if (!entityId) {
    console.warn("general revalidate: no entity ID in event data");
    return;
  }

  console.log(`🔄 General revalidate for entity:`, entityId);

  // Ревалидируем главную страницу и общие списки
  await triggerGeneralRevalidate();
}

async function triggerGeneralRevalidate() {
  console.log(`🔔 general revalidate triggered`);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Ревалидируем общие страницы
  const tags = ["general"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ General revalidation successful`);
  } catch (err) {
    console.error(`general revalidate: revalidate call failed`, err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "region.created",
    "region.updated",
    "region.deleted",
    "shipping-option.created",
    "shipping-option.updated",
    "shipping-option.deleted",
    "payment-provider.created",
    "payment-provider.updated",
    "payment-provider.deleted",
    "fulfillment-provider.created",
    "fulfillment-provider.updated",
    "fulfillment-provider.deleted",
    "store.created",
    "store.updated",
    "store.deleted",
    "sales-channel.created",
    "sales-channel.updated",
    "sales-channel.deleted",
    "currency.created",
    "currency.updated",
    "currency.deleted",
    "price-list.created",
    "price-list.updated",
    "price-list.deleted",
    "discount.created",
    "discount.updated",
    "discount.deleted",
    "gift-card.created",
    "gift-card.updated",
    "gift-card.deleted",
    "order.created",
    "order.updated",
    "order.canceled",
    "order.completed",
    "order.archived",
    "order.fulfilled",
    "order.return_requested",
    "order.shipped",
    "order.requires_action",
    "order.payment_captured",
    "order.payment_capture_failed",
    "order.payment_authorized",
    "order.payment_authorization_failed",
    "order.payment_updated",
    "order.payment_refunded",
    "order.payment_refund_failed",
    "order.payment_canceled",
    "order.payment_cancelation_failed",
    "order.payment_processing",
    "inventory-item.created",
    "inventory-item.updated",
    "inventory-item.deleted",
    "inventory-level.created",
    "inventory-level.updated",
    "inventory-level.deleted",
    "stock-location.created",
    "stock-location.updated",
    "stock-location.deleted",
    "reservation-item.created",
    "reservation-item.updated",
    "reservation-item.deleted",
    "customer.created",
    "customer.updated",
    "customer.deleted",
    "customer-address.created",
    "customer-address.updated",
    "customer-address.deleted",
    "shipping-profile.created",
    "shipping-profile.updated",
    "shipping-profile.deleted",
    "fulfillment-set.created",
    "fulfillment-set.updated",
    "fulfillment-set.deleted",
    "service-zone.created",
    "service-zone.updated",
    "service-zone.deleted",
    "geo-zone.created",
    "geo-zone.updated",
    "geo-zone.deleted",
    "tax-rate.created",
    "tax-rate.updated",
    "tax-rate.deleted",
    "tax-region.created",
    "tax-region.updated",
    "tax-region.deleted",
  ],
};

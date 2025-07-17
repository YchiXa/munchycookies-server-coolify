import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🏠 Customer address events subscriber loaded");

export default async function customerAddressEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; customer_id?: string }>) {
  const addressId = data.id;
  const customerId = data.customer_id;
  if (!addressId) {
    console.warn("customer address event: no address ID in event data");
    return;
  }
  console.log(
    `🏠 Customer address event for:`,
    addressId,
    "customer:",
    customerId
  );
  // Здесь можно добавить интеграцию с внешними сервисами или валидацию
}

export const config: SubscriberConfig = {
  event: [
    "customer-address.created",
    "customer-address.updated",
    "customer-address.deleted",
  ],
};

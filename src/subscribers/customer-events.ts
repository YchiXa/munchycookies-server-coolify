import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("👤 Customer events subscriber loaded");

export default async function customerEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const customerId = data.id;
  if (!customerId) {
    console.warn("customer event: no customer ID in event data");
    return;
  }
  console.log(`👤 Customer event for:`, customerId);
  // Здесь можно добавить интеграцию с CRM, email и т.д.
}

export const config: SubscriberConfig = {
  event: ["customer.created", "customer.updated", "customer.deleted"],
};

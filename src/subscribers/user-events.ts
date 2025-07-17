import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("👤 User events subscriber loaded");

export default async function userEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  console.log("👤 User event:", data);
}

export const config: SubscriberConfig = {
  event: ["user.created", "user.updated", "user.deleted"],
};

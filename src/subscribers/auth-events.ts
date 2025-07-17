import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("🔑 Auth events subscriber loaded");

export default async function authEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  console.log("🔑 Auth event: password_reset", data);
}

export const config: SubscriberConfig = {
  event: ["auth.password_reset"],
};

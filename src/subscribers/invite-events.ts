import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("✉️ Invite events subscriber loaded");

export default async function inviteEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  console.log("✉️ Invite event:", data);
}

export const config: SubscriberConfig = {
  event: [
    "invite.accepted",
    "invite.created",
    "invite.deleted",
    "invite.resent",
  ],
};

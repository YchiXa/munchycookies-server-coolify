import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

console.log("📚 Collection events subscriber loaded");

export default async function collectionEventHandler({
  event: { data },
}: SubscriberArgs<{ id: string; handle?: string }>) {
  const collectionId = data.id;
  const handle = data.handle;

  if (!collectionId) {
    console.warn("collection revalidate: no collection ID in event data");
    return;
  }

  console.log(`📚 Collection revalidate for:`, collectionId);

  // Если handle есть в событии, используем его
  if (handle) {
    console.log("✅ Using handle from event:", handle);
    await triggerRevalidate(handle);
    return;
  }

  // Если handle нет в событии, попробуем получить через Store API
  console.log("⚠️ Handle not in event, trying Store API...");

  const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL!;
  const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!;

  try {
    const url = `${MEDUSA_BACKEND_URL}/store/collections/${collectionId}`;
    console.log("  - Requesting URL:", url);

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
    });

    if (!res.ok) {
      // Если сущность не найдена (удалена), ревалидируем общий список коллекций
      if (res.status === 404) {
        console.log(
          "  - Collection not found (deleted), revalidating collections list"
        );
        await triggerGeneralRevalidate();
        return;
      }
      throw new Error(`Store API ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    console.log("  - Store API response:", JSON.stringify(json, null, 2));

    // Если ответ пустой (коллекция удалена), ревалидируем общий список
    if (!json || Object.keys(json).length === 0) {
      console.log(
        "  - Collection deleted (empty response), revalidating collections list"
      );
      await triggerGeneralRevalidate();
      return;
    }

    const apiHandle = json.collection?.handle || json.handle;

    if (!apiHandle) {
      throw new Error("Collection handle not found");
    }

    console.log("  - Successfully got handle from Store API:", apiHandle);
    await triggerRevalidate(apiHandle);
  } catch (err) {
    console.error("collection revalidate: failed to fetch handle:", err);
    console.log("⚠️ Skipping revalidation for collection:", collectionId);
  }
}

async function triggerRevalidate(handle: string) {
  console.log(`🔔 collection revalidate for:`, handle);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Для коллекций ревалидируем список коллекций и страницу коллекции
  const tags = ["collections", `collection-${handle}`].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ Revalidation successful for collection:`, handle);
  } catch (err) {
    console.error(`collection revalidate: revalidate call failed`, err);
  }
}

async function triggerGeneralRevalidate() {
  console.log(`🔔 collection general revalidate`);

  const STOREFRONT_URL = process.env.STOREFRONT_URL!;
  const SECRET = process.env.REVALIDATE_SECRET!;
  const COUNTRY = process.env.DEFAULT_COUNTRY_CODE || "ru";

  // Ревалидируем только список коллекций
  const tags = ["collections"].join(",");
  const url = `${STOREFRONT_URL}/api/revalidate?secret=${SECRET}&tags=${tags}&countryCode=${COUNTRY}`;

  console.log("→ calling revalidate endpoint:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Revalidate API ${response.status}: ${response.statusText}`
      );
    }
    console.log(`✅ General revalidation successful for collections`);
  } catch (err) {
    console.error(`collection general revalidate: revalidate call failed`, err);
  }
}

export const config: SubscriberConfig = {
  event: [
    "product-collection.created",
    "product-collection.updated",
    "product-collection.deleted",
  ],
};

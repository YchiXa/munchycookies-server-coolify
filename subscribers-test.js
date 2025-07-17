export default async function rootTestHandler(args) {
  console.log("🧪 Root test subscriber fired for product:", args.event.data.id);
}

export const config = {
  event: "product.updated",
};

/** Import dữ liệu khởi tạo vào MongoDB. Không xóa dữ liệu đang có. */
require("dotenv").config();
const { MongoClient } = require("mongodb");
const products = require("../data/seed-products.json");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Thiếu MONGODB_URI trong .env");
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "mira_beauty");
    const collection = db.collection("products");
    await collection.createIndex({ slug: 1 }, { unique: true, name: "products_slug_unique" });
    await collection.createIndex({ category: 1, active: 1 }, { name: "products_category_active" });
    let inserted = 0, existing = 0;
    for (const item of products) {
      const { id, ...product } = item;
      const result = await collection.updateOne(
        { slug: product.slug },
        { $setOnInsert: { ...product, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++; else existing++;
    }
    console.log(`Hoàn tất: thêm ${inserted}, giữ nguyên ${existing} sản phẩm đã tồn tại.`);
  } finally { await client.close(); }
}
main().catch(error => { console.error(error); process.exit(1); });

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const { connectDatabase, mongoose } = require("../db");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");
const Counter = require("../models/Counter");

function readJson(directory, fileName) {
  const filePath = path.resolve(directory, fileName);
  if (!fs.existsSync(filePath)) return [];
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(value)) throw new Error(`${fileName} phải chứa một JSON array.`);
  return value;
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function upsertCounter(name, maximum) {
  await Counter.findOneAndUpdate(
    { _id: name },
    { $max: { SequenceValue: maximum } },
    { upsert: true }
  );
}

async function main() {
  const directory = process.env.SQL_EXPORT_DIR;
  if (!directory) throw new Error("Thiếu SQL_EXPORT_DIR trỏ tới thư mục chứa JSON export.");

  await connectDatabase();
  const users = readJson(directory, "MiraUsers.json");
  const products = readJson(directory, "Products.json");
  const orders = readJson(directory, "MiraOrders.json");
  const orderItems = readJson(directory, "MiraOrderItems.json");
  const categories = readJson(directory, "Categories.json");

  const itemsByOrder = new Map();
  for (const item of orderItems) {
    const key = Number(item.OrderId);
    if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
    itemsByOrder.get(key).push({
      ProductId: Number(item.ProductId),
      ProductName: String(item.ProductName || ""),
      UnitPrice: numberOr(item.UnitPrice, 0),
      Quantity: numberOr(item.Quantity, 1),
    });
  }

  for (const row of users) {
    await User.updateOne(
      { UserId: Number(row.UserId) },
      { $set: {
        UserId: Number(row.UserId),
        FullName: String(row.FullName || ""),
        Email: String(row.Email || "").trim().toLowerCase(),
        PasswordHash: String(row.PasswordHash || ""),
        PasswordSalt: String(row.PasswordSalt || ""),
        Role: row.Role === "Admin" ? "Admin" : "Customer",
        IsActive: row.IsActive === false || row.IsActive === 0 ? false : true,
        CreatedAt: row.CreatedAt ? new Date(row.CreatedAt) : new Date(),
      } },
      { upsert: true, runValidators: true }
    );
  }

  for (const row of products) {
    await Product.updateOne(
      { ProductId: Number(row.ProductId) },
      { $set: {
        ProductId: Number(row.ProductId),
        CategoryId: numberOr(row.CategoryId, 1),
        ProductName: String(row.ProductName || ""),
        Brand: String(row.Brand || ""),
        Description: String(row.Description || ""),
        Price: numberOr(row.Price, 0),
        StockQuantity: Math.max(0, numberOr(row.StockQuantity, 0)),
        ImageUrl: String(row.ImageUrl || "/images/product-serum.jpg"),
        IsActive: row.IsActive === false || row.IsActive === 0 ? false : true,
        CreatedAt: row.CreatedAt ? new Date(row.CreatedAt) : new Date(),
      } },
      { upsert: true, runValidators: true }
    );
  }

  for (const row of orders) {
    await Order.updateOne(
      { OrderId: Number(row.OrderId) },
      { $set: {
        OrderId: Number(row.OrderId),
        UserId: Number(row.UserId),
        CustomerName: String(row.CustomerName || ""),
        Phone: String(row.Phone || ""),
        Address: String(row.Address || ""),
        TotalAmount: numberOr(row.TotalAmount, 0),
        Status: String(row.Status || "Pending"),
        Items: itemsByOrder.get(Number(row.OrderId)) || [],
        CreatedAt: row.CreatedAt ? new Date(row.CreatedAt) : new Date(),
      } },
      { upsert: true, runValidators: true }
    );
  }

  for (const row of categories) {
    await Category.updateOne(
      { CategoryId: Number(row.CategoryId) },
      { $set: {
        CategoryId: Number(row.CategoryId),
        CategoryName: String(row.CategoryName || ""),
        IsActive: row.IsActive === false || row.IsActive === 0 ? false : true,
        CreatedAt: row.CreatedAt ? new Date(row.CreatedAt) : new Date(),
      } },
      { upsert: true, runValidators: true }
    );
  }

  await upsertCounter("users", users.reduce((max, row) => Math.max(max, Number(row.UserId) || 0), 0));
  await upsertCounter("products", products.reduce((max, row) => Math.max(max, Number(row.ProductId) || 0), 0));
  await upsertCounter("orders", orders.reduce((max, row) => Math.max(max, Number(row.OrderId) || 0), 0));
  await upsertCounter("categories", categories.reduce((max, row) => Math.max(max, Number(row.CategoryId) || 0), 0));

  console.log(`Imported ${users.length} users, ${categories.length} categories, ${products.length} products and ${orders.length} orders.`);
}

main()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error("Migration failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });

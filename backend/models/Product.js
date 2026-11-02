const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  ProductId: { type: Number, required: true, unique: true },
  CategoryId: { type: Number, default: 1 },
  ProductName: { type: String, required: true, trim: true },
  Brand: { type: String, default: "" },
  Description: { type: String, default: "" },
  Price: { type: Number, required: true, min: 0 },
  StockQuantity: { type: Number, required: true, min: 0, default: 0 },
  ImageUrl: { type: String, default: "/images/product-serum.jpg" },
  IsActive: { type: Boolean, default: true },
  CreatedAt: { type: Date, default: Date.now },
}, { collection: "Products" });

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);

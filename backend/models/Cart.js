const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  ProductId: { type: Number, required: true },
  Quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  UserId: { type: Number, required: true, unique: true },
  Items: { type: [cartItemSchema], default: [] },
  UpdatedAt: { type: Date, default: Date.now },
}, { collection: "Carts" });

module.exports = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  ProductId: { type: Number, required: true },
  ProductName: { type: String, required: true },
  UnitPrice: { type: Number, required: true, min: 0 },
  Quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  OrderId: { type: Number, required: true, unique: true },
  UserId: { type: Number, required: true },
  CustomerName: { type: String, required: true },
  Phone: { type: String, required: true },
  Address: { type: String, required: true },
  TotalAmount: { type: Number, required: true, min: 0 },
  Status: {
    type: String,
    enum: ["Pending", "Confirmed", "Shipping", "Completed", "Cancelled"],
    default: "Pending",
  },
  Items: { type: [orderItemSchema], default: [] },
  CreatedAt: { type: Date, default: Date.now },
}, { collection: "MiraOrders" });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);

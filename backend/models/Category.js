const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  CategoryId: { type: Number, required: true, unique: true },
  CategoryName: { type: String, required: true, trim: true },
  IsActive: { type: Boolean, default: true },
  CreatedAt: { type: Date, default: Date.now },
}, { collection: "Categories" });

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);

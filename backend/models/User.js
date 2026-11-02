const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  UserId: { type: Number, required: true, unique: true },
  FullName: { type: String, required: true, trim: true },
  Email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  PasswordHash: { type: String, required: true },
  PasswordSalt: { type: String, required: true },
  Role: { type: String, enum: ["Customer", "Admin"], default: "Customer" },
  IsActive: { type: Boolean, default: true },
  CreatedAt: { type: Date, default: Date.now },
}, { collection: "MiraUsers" });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

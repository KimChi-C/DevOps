require("dotenv").config();

const crypto = require("crypto");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { connectDatabase, mongoose } = require("./db");
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Counter = require("./models/Counter");

const app = express();
const PORT = process.env.PORT || 5000;
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(48).toString("hex");

if (!process.env.TOKEN_SECRET) {
  console.warn("TOKEN_SECRET chưa được cấu hình; token chỉ ổn định trong tiến trình hiện tại.");
}

const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mira-beauty-shop.onrender.com",
  ...configuredOrigins,
];

app.use(cors({
  origin(origin, callback) {
    const allowed =
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin);

    if (allowed) return callback(null, true);

    console.error("CORS blocked Origin:", origin);
    return callback(new Error("CORS: Origin không được phép"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu JSON trong yêu cầu không hợp lệ.",
    });
  }
  next(error);
});

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") };
}

function signToken(user) {
  const payload = Buffer.from(JSON.stringify({
    userId: user.UserId,
    email: user.Email,
    role: user.Role,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(parts[0]).digest();
    const actual = Buffer.from(parts[1], "base64url");
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    return payload.exp >= Date.now() ? payload : null;
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập lại." });
  try {
    await connectDatabase();
    const currentUser = await User.findOne({ UserId: payload.userId }).lean();
    if (!currentUser || !currentUser.IsActive)
      return res.status(401).json({ success: false, message: "Tài khoản không còn hoạt động." });
    req.user = { userId: currentUser.UserId, email: currentUser.Email, role: currentUser.Role };
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(500).json({ success: false, message: "Không thể xác minh tài khoản." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "Admin")
    return res.status(403).json({ success: false, message: "Bạn cần quyền Admin." });
  next();
}

function publicUser(user) {
  return {
    id: user.UserId,
    name: user.FullName,
    email: user.Email,
    role: user.Role,
    token: signToken(user),
  };
}

async function nextId(name) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { SequenceValue: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.SequenceValue;
}

function productResponse(product) {
  return {
    ProductId: product.ProductId,
    CategoryId: product.CategoryId,
    ProductName: product.ProductName,
    Brand: product.Brand,
    Description: product.Description,
    Price: product.Price,
    StockQuantity: product.StockQuantity,
    ImageUrl: product.ImageUrl,
    IsActive: product.IsActive,
    CreatedAt: product.CreatedAt,
  };
}

app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "MIRA Beauty Shop API is running" })
);

app.get("/api/db-check", async (req, res) => {
  try {
    await connectDatabase();
    res.json({
      success: true,
      database: mongoose.connection.db.databaseName,
      authAndOrderTables: true,
      engine: "MongoDB",
    });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, message: "Không kết nối được MongoDB Atlas. Kiểm tra MONGODB_URI." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const fullName = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!fullName || !email.includes("@") || password.length < 8)
    return res.status(400).json({ success: false, message: "Nhập họ tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự." });
  try {
    await connectDatabase();
    if (await User.exists({ Email: email }))
      return res.status(409).json({ success: false, message: "Email này đã được đăng ký." });
    const { salt, hash } = hashPassword(password);
    const user = await User.create({
      UserId: await nextId("users"),
      FullName: fullName,
      Email: email,
      PasswordHash: hash,
      PasswordSalt: salt,
      Role: "Customer",
      IsActive: true,
    });
    res.status(201).json({ success: true, data: publicUser(user) });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: "Không thể tạo tài khoản. Hãy kiểm tra kết nối MongoDB Atlas." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  try {
    await connectDatabase();
    const user = await User.findOne({ Email: email });
    if (!user) return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    if (!user.IsActive) return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa." });
    const attempted = hashPassword(password, user.PasswordSalt).hash;
    const a = Buffer.from(attempted, "hex");
    const b = Buffer.from(user.PasswordHash, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    res.json({ success: true, data: publicUser(user) });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Không thể đăng nhập. Hãy kiểm tra MongoDB Atlas." });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    await connectDatabase();
    const products = await Product.find({ IsActive: true }).sort({ CreatedAt: -1 }).lean();
    res.json({ success: true, count: products.length, data: products.map(productResponse) });
  } catch (error) {
    console.error("Products error:", error.message);
    res.status(500).json({ success: false, message: "Không tải được sản phẩm. Kiểm tra MongoDB Atlas." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ." });
  try {
    await connectDatabase();
    const product = await Product.findOne({ ProductId: id, IsActive: true }).lean();
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
    res.json({ success: true, data: productResponse(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không tải được chi tiết sản phẩm." });
  }
});

app.post("/api/orders", requireAuth, async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const phone = String(req.body.phone || "").trim();
  const address = String(req.body.address || "").trim();
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!fullName || !phone || !address || !items.length)
    return res.status(400).json({ success: false, message: "Thiếu thông tin giao hàng hoặc sản phẩm." });

  const session = await mongoose.startSession();
  try {
    await connectDatabase();
    let result;
    await session.withTransaction(async () => {
      let total = 0;
      const resolved = [];
      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99)
          throw new Error("Số lượng sản phẩm không hợp lệ.");
        const product = await Product.findOne({ ProductId: productId }).session(session);
        if (!product || !product.IsActive) throw new Error("Một sản phẩm không còn kinh doanh.");
        if (product.StockQuantity < quantity) throw new Error(`Sản phẩm ${product.ProductName} không đủ tồn kho.`);
        total += Number(product.Price) * quantity;
        resolved.push({ product, quantity });
      }
      const orderId = await nextId("orders");
      const orderItems = [];
      for (const { product, quantity } of resolved) {
        orderItems.push({
          ProductId: product.ProductId,
          ProductName: product.ProductName,
          UnitPrice: product.Price,
          Quantity: quantity,
        });
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, StockQuantity: { $gte: quantity } },
          { $inc: { StockQuantity: -quantity } },
          { new: true, session }
        );
        if (!updated) throw new Error(`Sản phẩm ${product.ProductName} không đủ tồn kho.`);
      }
      await Order.create([{
        OrderId: orderId,
        UserId: req.user.userId,
        CustomerName: fullName,
        Phone: phone,
        Address: address,
        TotalAmount: total,
        Status: "Pending",
        Items: orderItems,
      }], { session });
      result = { orderId, totalAmount: total, status: "Pending" };
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Order error:", error.message);
    res.status(400).json({ success: false, message: error.message || "Không tạo được đơn hàng." });
  } finally {
    await session.endSession();
  }
});

app.get("/api/orders/my", requireAuth, async (req, res) => {
  try {
    await connectDatabase();
    const orders = await Order.find({ UserId: req.user.userId }).sort({ CreatedAt: -1 }).lean();
    res.json({ success: true, data: orders.map((order) => ({
      OrderId: order.OrderId,
      CustomerName: order.CustomerName,
      Phone: order.Phone,
      Address: order.Address,
      TotalAmount: order.TotalAmount,
      Status: order.Status,
      CreatedAt: order.CreatedAt,
    })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không tải được đơn hàng." });
  }
});

app.get("/api/admin/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDatabase();
    const products = await Product.find().sort({ CreatedAt: -1 }).lean();
    res.json({ success: true, data: products.map(productResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không tải được danh sách sản phẩm." });
  }
});

app.patch("/api/admin/products/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || typeof req.body?.isActive !== "boolean")
    return res.status(400).json({ success: false, message: "Trạng thái sản phẩm không hợp lệ." });
  try {
    await connectDatabase();
    const product = await Product.findOneAndUpdate(
      { ProductId: id },
      { IsActive: req.body.isActive },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không cập nhật được trạng thái sản phẩm." });
  }
});

app.get("/api/admin/summary", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDatabase();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const [customerCount, activeProductCount, orderCount, pendingOrderCount, ordersForRevenue, recentOrders, ordersForTop] =
      await Promise.all([
        User.countDocuments({ Role: "Customer" }),
        Product.countDocuments({ IsActive: true }),
        Order.countDocuments(),
        Order.countDocuments({ Status: "Pending" }),
        Order.find({ Status: { $ne: "Cancelled" } }).lean(),
        Order.find().sort({ CreatedAt: -1 }).limit(8).lean(),
        Order.find({ Status: { $ne: "Cancelled" } }).lean(),
      ]);

    const revenue = ordersForRevenue.reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0);
    const revenueByDay = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + offset);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dayRevenue = ordersForRevenue
        .filter((order) => order.CreatedAt >= day && order.CreatedAt < nextDay)
        .reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0);
      revenueByDay.push({ date: day.toISOString().slice(0, 10), revenue: dayRevenue });
    }

    const sold = new Map();
    for (const order of ordersForTop) {
      for (const item of order.Items || []) {
        const current = sold.get(item.ProductId) || { ProductId: item.ProductId, ProductName: item.ProductName, unitsSold: 0, revenue: 0 };
        current.unitsSold += item.Quantity;
        current.revenue += item.UnitPrice * item.Quantity;
        sold.set(item.ProductId, current);
      }
    }
    const topProducts = [...sold.values()]
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        customerCount,
        activeProductCount,
        orderCount,
        pendingOrderCount,
        revenue,
        revenueByDay,
        topProducts,
        recentOrders: recentOrders.map((order) => ({
          OrderId: order.OrderId,
          CustomerName: order.CustomerName,
          TotalAmount: order.TotalAmount,
          Status: order.Status,
          CreatedAt: order.CreatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Admin dashboard:", error.message);
    res.status(500).json({ success: false, message: "Không tải được số liệu tổng quan." });
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDatabase();
    const users = await User.find().sort({ CreatedAt: -1 }).lean();
    res.json({ success: true, data: users.map((user) => ({
      UserId: user.UserId,
      FullName: user.FullName,
      Email: user.Email,
      Role: user.Role,
      IsActive: user.IsActive,
      CreatedAt: user.CreatedAt,
    })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không tải được danh sách người dùng." });
  }
});

app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  const { role, isActive } = req.body || {};
  if (!Number.isInteger(userId) || userId < 1 ||
      (role !== undefined && !["Admin", "Customer"].includes(role)) ||
      (isActive !== undefined && typeof isActive !== "boolean") ||
      (role === undefined && isActive === undefined))
    return res.status(400).json({ success: false, message: "Thông tin người dùng không hợp lệ." });
  if (userId === req.user.userId && (role === "Customer" || isActive === false))
    return res.status(400).json({ success: false, message: "Không thể tự hạ quyền hoặc vô hiệu hóa tài khoản đang đăng nhập." });

  try {
    await connectDatabase();
    const target = await User.findOne({ UserId: userId });
    if (!target) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    const nextRole = role ?? target.Role;
    const nextIsActive = isActive ?? target.IsActive;
    if (target.Role === "Admin" && target.IsActive && (nextRole !== "Admin" || !nextIsActive)) {
      const activeAdmins = await User.countDocuments({ Role: "Admin", IsActive: true });
      if (activeAdmins <= 1)
        return res.status(400).json({ success: false, message: "Cần giữ lại ít nhất một Admin đang hoạt động." });
    }
    target.Role = nextRole;
    target.IsActive = nextIsActive;
    await target.save();
    res.json({ success: true, data: { UserId: userId, Role: nextRole, IsActive: nextIsActive } });
  } catch (error) {
    console.error("Admin update user:", error.message);
    res.status(500).json({ success: false, message: "Không cập nhật được người dùng." });
  }
});

app.post("/api/admin/products", requireAuth, requireAdmin, async (req, res) => {
  const p = req.body || {};
  if (!String(p.ProductName || "").trim() || !Number.isFinite(Number(p.Price)) || Number(p.Price) < 0)
    return res.status(400).json({ success: false, message: "Tên sản phẩm và giá hợp lệ là bắt buộc." });
  try {
    await connectDatabase();
    const product = await Product.create({
      ProductId: await nextId("products"),
      CategoryId: Number(p.CategoryId) || 1,
      ProductName: String(p.ProductName).trim(),
      Brand: String(p.Brand || ""),
      Description: String(p.Description || ""),
      Price: Number(p.Price),
      StockQuantity: Math.max(0, Number(p.StockQuantity) || 0),
      ImageUrl: String(p.ImageUrl || "/images/product-serum.jpg"),
      IsActive: true,
    });
    res.status(201).json({ success: true, data: { ProductId: product.ProductId } });
  } catch (error) {
    console.error("Admin create product:", error.message);
    res.status(500).json({ success: false, message: "Không thêm được sản phẩm." });
  }
});

app.put("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const p = req.body || {};
  if (!Number.isInteger(id))
    return res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ." });
  try {
    await connectDatabase();
    const product = await Product.findOneAndUpdate(
      { ProductId: id },
      {
        CategoryId: Number(p.CategoryId) || 1,
        ProductName: String(p.ProductName || "").trim(),
        Brand: String(p.Brand || ""),
        Description: String(p.Description || ""),
        Price: Number(p.Price),
        StockQuantity: Math.max(0, Number(p.StockQuantity) || 0),
        ImageUrl: String(p.ImageUrl || "/images/product-serum.jpg"),
      },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
    res.json({ success: true, rowsAffected: 1 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không cập nhật được sản phẩm." });
  }
});

app.delete("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await connectDatabase();
    const product = await Product.findOneAndUpdate(
      { ProductId: id },
      { IsActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
    res.json({ success: true, rowsAffected: 1 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không ẩn được sản phẩm." });
  }
});

app.get("/api/admin/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    await connectDatabase();
    const orders = await Order.find().sort({ CreatedAt: -1 }).lean();
    res.json({ success: true, data: orders.map((order) => ({
      OrderId: order.OrderId,
      UserId: order.UserId,
      CustomerName: order.CustomerName,
      Phone: order.Phone,
      Address: order.Address,
      TotalAmount: order.TotalAmount,
      Status: order.Status,
      CreatedAt: order.CreatedAt,
    })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không tải được đơn hàng." });
  }
});

app.patch("/api/admin/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  const allowed = ["Pending", "Confirmed", "Shipping", "Completed", "Cancelled"];
  const status = String(req.body.status || "");
  const id = Number(req.params.id);
  if (!allowed.includes(status) || !Number.isInteger(id))
    return res.status(400).json({ success: false, message: "Trạng thái đơn hàng không hợp lệ." });
  try {
    await connectDatabase();
    const order = await Order.findOneAndUpdate(
      { OrderId: id },
      { Status: status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
    res.json({ success: true, rowsAffected: 1 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không cập nhật được trạng thái đơn hàng." });
  }
});

async function seedAdminFromEnvironment() {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!email || password.length < 12) return;
  try {
    await connectDatabase();
    let user = await User.findOne({ Email: email });
    if (user) {
      user.Role = "Admin";
      await user.save();
    } else {
      const { salt, hash } = hashPassword(password);
      await User.create({
        UserId: await nextId("users"),
        FullName: "MIRA Administrator",
        Email: email,
        PasswordHash: hash,
        PasswordSalt: salt,
        Role: "Admin",
        IsActive: true,
      });
    }
    console.log("MIRA admin account initialized from environment.");
  } catch (error) {
    console.error("Admin initialization skipped:", error.message);
  }
}

async function seedProductsIfEmpty() {
  await connectDatabase();
  const productCount = await Product.countDocuments({});
  if (productCount >= 30) return;

  const products = [
    ["Radiance Vitamin C Serum", "MIRA", "Tinh chất vitamin C giúp da sáng và đều màu.", 429000, 50, "/images/product-vitamin-c.jpg", 1],
    ["Hydrating Face Cream", "MIRA", "Kem dưỡng ẩm giúp da mềm mịn suốt cả ngày.", 359000, 40, "/images/product-cream.jpg", 1],
    ["Gentle Skin Cleanser", "MIRA", "Sữa rửa mặt dịu nhẹ phù hợp mọi loại da.", 249000, 60, "/images/product-cleanser.jpg", 1],
    ["Brightening Essence", "MIRA", "Tinh chất cấp ẩm và làm sáng da.", 389000, 35, "/images/product-essence.jpg", 1],
    ["Night Repair Cream", "MIRA", "Kem dưỡng ban đêm hỗ trợ phục hồi da.", 469000, 30, "/images/product-night-cream.jpg", 1],
    ["Daily Sun Gel SPF50+", "MIRA", "Gel chống nắng nhẹ tênh, không nhờn rít.", 319000, 45, "/images/product-sun-gel.jpg", 3],
    ["Hydrating Body Lotion", "MIRA", "Dưỡng thể cấp ẩm cho da mềm mại.", 299000, 40, "/images/product-body-lotion.jpg", 4],
    ["Silk Matte Lipstick", "MIRA", "Son lì mịn môi với sắc màu bền màu.", 289000, 55, "/images/product-lipstick.jpg", 2],
    ["Natural Glow Foundation", "MIRA", "Kem nền che phủ nhẹ, mang lại vẻ tự nhiên.", 399000, 25, "/images/product-foundation.jpg", 2],
    ["Floral Eau de Parfum", "MIRA", "Hương hoa cỏ thanh lịch và lưu hương lâu.", 549000, 20, "/images/product-perfume-floral.jpg", 5],
    ["Repairing Hair Shampoo", "MIRA", "Dầu gội giúp tóc sạch mềm và dễ chải.", 279000, 35, "/images/product-shampoo.jpg", 1],
    ["Volumizing Mascara", "MIRA", "Mascara làm dài và cong mi tự nhiên.", 329000, 30, "/images/product-mascara.jpg", 2],
    ["Refreshing Toner", "MIRA", "Nước cân bằng da, cấp ẩm và làm dịu.", 259000, 50, "/images/product-toner.jpg", 1],
    ["Hydrating Face Serum", "MIRA", "Tinh chất dưỡng ẩm giúp da căng mọng.", 449000, 40, "/images/product-serum.jpg", 1],
    ["Daily Face Mist", "MIRA", "Xịt khoáng cấp ẩm tức thì cho da.", 219000, 45, "/images/product-face-mist.jpg", 1],
    ["Tinted Daily Sunscreen", "MIRA", "Kem chống nắng tông màu nhẹ tự nhiên.", 349000, 35, "/images/product-tinted-sunscreen.jpg", 3],
    ["Protective Sun Cream", "MIRA", "Kem chống nắng bảo vệ da dưới ánh nắng.", 339000, 40, "/images/product-sun-cream.jpg", 3],
    ["Classic Sunscreen SPF50", "MIRA", "Sản phẩm chống nắng phổ rộng SPF50.", 329000, 45, "/images/product-sunscreen.jpg", 3],
    ["Nourishing Hand Cream", "MIRA", "Kem dưỡng tay mềm mịn, không nhờn.", 189000, 60, "/images/product-hand-cream.jpg", 4],
    ["Exfoliating Body Scrub", "MIRA", "Tẩy tế bào chết giúp da sáng mịn.", 269000, 35, "/images/product-body-scrub.jpg", 4],
    ["Gentle Body Wash", "MIRA", "Sữa tắm làm sạch dịu nhẹ và lưu hương.", 239000, 50, "/images/product-body-wash.jpg", 4],
    ["Citrus Eau de Parfum", "MIRA", "Hương cam chanh tươi mát, tràn đầy năng lượng.", 529000, 25, "/images/product-perfume-citrus.jpg", 5],
    ["Floral Perfume Mist", "MIRA", "Xịt thơm cơ thể hương hoa nhẹ nhàng.", 289000, 40, "/images/product-perfume-mist.jpg", 5],
    ["Luxury Perfume Gift Set", "MIRA", "Bộ quà tặng nước hoa sang trọng.", 799000, 15, "/images/product-perfume-gift-set.jpg", 5],
    ["Silky Hair Conditioner", "MIRA", "Kem xả giúp tóc mềm mượt và óng ả.", 299000, 35, "/images/product-conditioner.jpg", 1],
    ["Radiant Blush", "MIRA", "Phấn má tạo sắc hồng tự nhiên.", 249000, 40, "/images/product-blush.jpg", 2],
    ["Perfect Concealer", "MIRA", "Che khuyết điểm, làm đều sắc da.", 279000, 35, "/images/product-concealer.jpg", 2],
    ["Glam Eyeshadow Palette", "MIRA", "Bảng màu mắt đa dạng cho trang điểm.", 399000, 25, "/images/product-eyeshadow.jpg", 2],
    ["Natural Highlighter", "MIRA", "Phấn bắt sáng tạo hiệu ứng khỏe khoắn.", 269000, 30, "/images/product-highlighter.jpg", 2],
    ["Long-lasting Setting Spray", "MIRA", "Xịt khóa trang điểm giúp lớp makeup lâu trôi.", 319000, 30, "/images/product-setting-spray.jpg", 2],
  ];

  for (const [index, [ProductName, Brand, Description, Price, StockQuantity, ImageUrl, CategoryId]] of products.entries()) {
    await Product.updateOne(
      { ProductId: index + 1 },
      {
        $setOnInsert: {
          ProductId: index + 1,
          CategoryId,
          ProductName,
          Brand,
          Description,
          Price,
          StockQuantity,
          ImageUrl,
          IsActive: true,
        },
      },
      { upsert: true }
    );
  }
  await Counter.findOneAndUpdate(
    { _id: "products" },
    { $max: { SequenceValue: products.length } },
    { upsert: true }
  );
  console.log(`Initialized ${products.length} products in MongoDB.`);
}

const frontendDist = path.resolve(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
  res.sendFile(path.join(frontendDist, "index.html"), (error) => {
    if (error) next(error);
  });
});

(async () => {
  await seedAdminFromEnvironment();
  try {
    await seedProductsIfEmpty();
  } catch (error) {
    console.error("Product initialization skipped:", error.message);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MIRA Beauty Shop is running on port ${PORT}`);
  });
})();

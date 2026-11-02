require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const { getPool, sql } = require("./db");

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked Origin:", origin);
      return callback(new Error("CORS: Origin không được phép"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5000;
const TOKEN_SECRET = process.env.TOKEN_SECRET || "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_BEFORE_DEPLOYING";

app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "MIRA Beauty Shop API is running" })
);

async function ensureTables(pool) {
  await pool.request().query(`
    IF OBJECT_ID('dbo.MiraUsers', 'U') IS NULL
    CREATE TABLE dbo.MiraUsers (
      UserId INT IDENTITY(1,1) PRIMARY KEY,
      FullName NVARCHAR(150) NOT NULL,
      Email NVARCHAR(255) NOT NULL UNIQUE,
      PasswordHash NVARCHAR(255) NOT NULL,
      PasswordSalt NVARCHAR(255) NOT NULL,
      Role NVARCHAR(20) NOT NULL CONSTRAINT DF_MiraUsers_Role DEFAULT 'Customer',
      IsActive BIT NOT NULL CONSTRAINT DF_MiraUsers_IsActive DEFAULT 1,
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_MiraUsers_CreatedAt DEFAULT SYSUTCDATETIME()
    );
    IF COL_LENGTH('dbo.MiraUsers', 'IsActive') IS NULL
      ALTER TABLE dbo.MiraUsers ADD IsActive BIT NOT NULL
        CONSTRAINT DF_MiraUsers_IsActive DEFAULT 1;
    IF OBJECT_ID('dbo.MiraOrders', 'U') IS NULL
    CREATE TABLE dbo.MiraOrders (
      OrderId INT IDENTITY(1,1) PRIMARY KEY,
      UserId INT NOT NULL,
      CustomerName NVARCHAR(150) NOT NULL,
      Phone NVARCHAR(40) NOT NULL,
      Address NVARCHAR(500) NOT NULL,
      TotalAmount DECIMAL(18,2) NOT NULL,
      Status NVARCHAR(30) NOT NULL CONSTRAINT DF_MiraOrders_Status DEFAULT 'Pending',
      CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_MiraOrders_CreatedAt DEFAULT SYSUTCDATETIME(),
      CONSTRAINT FK_MiraOrders_User FOREIGN KEY(UserId) REFERENCES dbo.MiraUsers(UserId)
    );
    IF OBJECT_ID('dbo.MiraOrderItems', 'U') IS NULL
    CREATE TABLE dbo.MiraOrderItems (
      OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
      OrderId INT NOT NULL,
      ProductId INT NOT NULL,
      ProductName NVARCHAR(255) NOT NULL,
      UnitPrice DECIMAL(18,2) NOT NULL,
      Quantity INT NOT NULL,
      CONSTRAINT FK_MiraOrderItems_Order FOREIGN KEY(OrderId) REFERENCES dbo.MiraOrders(OrderId)
    );
  `);
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}
function signToken(user) {
  const payload = Buffer.from(JSON.stringify({ userId: user.UserId, email: user.Email, role: user.Role, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(parts[0]).digest();
  let actual;
  try { actual = Buffer.from(parts[1], "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập lại." });
  try {
    const result = await (await getPool()).request()
      .input("id", sql.Int, user.userId)
      .query("SELECT UserId,Email,Role,IsActive FROM dbo.MiraUsers WHERE UserId=@id");
    const currentUser = result.recordset[0];
    if (!currentUser || !currentUser.IsActive)
      return res.status(401).json({ success: false, message: "Tài khoản không còn hoạt động." });
    req.user = {
      userId: currentUser.UserId,
      email: currentUser.Email,
      role: currentUser.Role,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(500).json({ success: false, message: "Không thể xác minh tài khoản." });
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== "Admin") return res.status(403).json({ success: false, message: "Bạn cần quyền Admin." });
  next();
}
function publicUser(user) {
  return { id: user.UserId, name: user.FullName, email: user.Email, role: user.Role, token: signToken(user) };
}

app.get("/api/db-check", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT DB_NAME() AS databaseName");
    await ensureTables(pool);
    res.json({ success: true, database: result.recordset[0].databaseName, authAndOrderTables: true });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, message: "Không kết nối được cơ sở dữ liệu. Kiểm tra cấu hình backend." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const fullName = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!fullName || !email.includes("@") || password.length < 8)
    return res.status(400).json({ success: false, message: "Nhập họ tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự." });
  try {
    const pool = await getPool(); await ensureTables(pool);
    const exists = await pool.request().input("email", sql.NVarChar(255), email)
      .query("SELECT UserId FROM dbo.MiraUsers WHERE Email=@email");
    if (exists.recordset.length) return res.status(409).json({ success: false, message: "Email này đã được đăng ký." });
    const { salt, hash } = hashPassword(password);
    const result = await pool.request()
      .input("name", sql.NVarChar(150), fullName)
      .input("email", sql.NVarChar(255), email)
      .input("hash", sql.NVarChar(255), hash)
      .input("salt", sql.NVarChar(255), salt)
      .query(`INSERT INTO dbo.MiraUsers(FullName,Email,PasswordHash,PasswordSalt,Role)
              OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.Role
              VALUES(@name,@email,@hash,@salt,'Customer')`);
    res.status(201).json({ success: true, data: publicUser(result.recordset[0]) });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: "Không thể tạo tài khoản. Hãy kiểm tra kết nối cơ sở dữ liệu." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  try {
    const pool = await getPool(); await ensureTables(pool);
    const result = await pool.request().input("email", sql.NVarChar(255), email)
      .query("SELECT TOP 1 UserId,FullName,Email,PasswordHash,PasswordSalt,Role,IsActive FROM dbo.MiraUsers WHERE Email=@email");
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    if (!user.IsActive) return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa." });
    const attempted = hashPassword(password, user.PasswordSalt).hash;
    const a = Buffer.from(attempted, "hex"), b = Buffer.from(user.PasswordHash, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    res.json({ success: true, data: publicUser(user) });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Không thể đăng nhập. Hãy kiểm tra cơ sở dữ liệu." });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ProductId, CategoryId, ProductName, Brand, Description, Price,
             StockQuantity, ImageUrl, IsActive, CreatedAt
      FROM dbo.Products WHERE IsActive = 1 ORDER BY CreatedAt DESC
    `);
    res.json({ success: true, count: result.recordset.length, data: result.recordset });
  } catch (error) {
    console.error("Products error:", error.message);
    res.status(500).json({ success: false, message: "Không tải được sản phẩm. Kiểm tra bảng dbo.Products trong SQL Server." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("id", sql.Int, Number(req.params.id))
      .query("SELECT ProductId,CategoryId,ProductName,Brand,Description,Price,StockQuantity,ImageUrl,IsActive,CreatedAt FROM dbo.Products WHERE ProductId=@id AND IsActive=1");
    if (!result.recordset.length) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) { res.status(500).json({ success: false, message: "Không tải được chi tiết sản phẩm." }); }
});

app.post("/api/orders", requireAuth, async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const phone = String(req.body.phone || "").trim();
  const address = String(req.body.address || "").trim();
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!fullName || !phone || !address || !items.length)
    return res.status(400).json({ success: false, message: "Thiếu thông tin giao hàng hoặc sản phẩm." });
  const transaction = new sql.Transaction(await getPool());
  try {
    await ensureTables(await getPool());
    await transaction.begin();
    let total = 0; const resolved = [];
    for (const item of items) {
      const productId = Number(item.productId), quantity = Number(item.quantity);
      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Số lượng sản phẩm không hợp lệ.");
      const r = await new sql.Request(transaction).input("id", sql.Int, productId).query("SELECT ProductId,ProductName,Price,StockQuantity,IsActive FROM dbo.Products WITH (UPDLOCK,ROWLOCK) WHERE ProductId=@id");
      const p = r.recordset[0];
      if (!p || !p.IsActive) throw new Error("Một sản phẩm không còn kinh doanh.");
      if (p.StockQuantity < quantity) throw new Error(`Sản phẩm ${p.ProductName} không đủ tồn kho.`);
      total += Number(p.Price) * quantity;
      resolved.push({ ...p, quantity });
    }
    const order = await new sql.Request(transaction)
      .input("userId", sql.Int, req.user.userId).input("name", sql.NVarChar(150), fullName)
      .input("phone", sql.NVarChar(40), phone).input("address", sql.NVarChar(500), address)
      .input("total", sql.Decimal(18,2), total)
      .query("INSERT INTO dbo.MiraOrders(UserId,CustomerName,Phone,Address,TotalAmount,Status) OUTPUT INSERTED.OrderId VALUES(@userId,@name,@phone,@address,@total,'Pending')");
    const orderId = order.recordset[0].OrderId;
    for (const p of resolved) {
      await new sql.Request(transaction).input("orderId", sql.Int, orderId).input("productId", sql.Int, p.ProductId)
        .input("name", sql.NVarChar(255), p.ProductName).input("price", sql.Decimal(18,2), p.Price).input("quantity", sql.Int, p.quantity)
        .query("INSERT INTO dbo.MiraOrderItems(OrderId,ProductId,ProductName,UnitPrice,Quantity) VALUES(@orderId,@productId,@name,@price,@quantity)");
      await new sql.Request(transaction).input("id", sql.Int, p.ProductId).input("quantity", sql.Int, p.quantity)
        .query("UPDATE dbo.Products SET StockQuantity=StockQuantity-@quantity WHERE ProductId=@id");
    }
    await transaction.commit();
    res.status(201).json({ success: true, data: { orderId, totalAmount: total, status: "Pending" } });
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    console.error("Order error:", error.message);
    res.status(400).json({ success: false, message: error.message || "Không tạo được đơn hàng." });
  }
});

app.get("/api/orders/my", requireAuth, async (req, res) => {
  try {
    const pool = await getPool(); await ensureTables(pool);
    const result = await pool.request().input("userId", sql.Int, req.user.userId)
      .query("SELECT OrderId,CustomerName,Phone,Address,TotalAmount,Status,CreatedAt FROM dbo.MiraOrders WHERE UserId=@userId ORDER BY CreatedAt DESC");
    res.json({ success: true, data: result.recordset });
  } catch (error) { res.status(500).json({ success: false, message: "Không tải được đơn hàng." }); }
});

app.get("/api/admin/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT ProductId,CategoryId,ProductName,Brand,Description,Price,StockQuantity,ImageUrl,IsActive,CreatedAt FROM dbo.Products ORDER BY CreatedAt DESC");
    res.json({ success: true, data: r.recordset });
  } catch (error) { res.status(500).json({ success: false, message: "Không tải được danh sách sản phẩm." }); }
});
app.patch("/api/admin/products/:id/status", requireAuth, requireAdmin, async (req, res) => {
  if (typeof req.body?.isActive !== "boolean")
    return res.status(400).json({ success: false, message: "Trạng thái sản phẩm không hợp lệ." });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("id", sql.Int, Number(req.params.id))
      .input("isActive", sql.Bit, req.body.isActive)
      .query("UPDATE dbo.Products SET IsActive=@isActive WHERE ProductId=@id");
    if (!result.rowsAffected[0])
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
    res.json({ success: true });
  } catch (error) {
    console.error("Admin update product status:", error.message);
    res.status(500).json({ success: false, message: "Không cập nhật được trạng thái sản phẩm." });
  }
});
app.get("/api/admin/summary", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    await ensureTables(pool);
    const [totals, revenue, topProducts, recentOrders] = await Promise.all([
      pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.MiraUsers WHERE Role='Customer') AS customerCount,
          (SELECT COUNT(*) FROM dbo.Products WHERE IsActive=1) AS activeProductCount,
          (SELECT COUNT(*) FROM dbo.MiraOrders) AS orderCount,
          (SELECT COUNT(*) FROM dbo.MiraOrders WHERE Status='Pending') AS pendingOrderCount,
          (SELECT COALESCE(SUM(TotalAmount),0) FROM dbo.MiraOrders WHERE Status<>'Cancelled') AS revenue
      `),
      pool.request().query(`
        WITH days AS (
          SELECT CAST(DATEADD(day, -6, CAST(GETDATE() AS date)) AS date) AS salesDate
          UNION ALL
          SELECT DATEADD(day, 1, salesDate) FROM days
          WHERE salesDate < CAST(GETDATE() AS date)
        )
        SELECT CONVERT(char(10), days.salesDate, 23) AS date,
               COALESCE(SUM(CASE WHEN orders.Status <> 'Cancelled' THEN orders.TotalAmount ELSE 0 END),0) AS revenue
        FROM days
        LEFT JOIN dbo.MiraOrders AS orders ON CAST(orders.CreatedAt AS date)=days.salesDate
        GROUP BY days.salesDate ORDER BY days.salesDate
        OPTION (MAXRECURSION 7)
      `),
      pool.request().query(`
        SELECT TOP 5 item.ProductId, item.ProductName,
               SUM(item.Quantity) AS unitsSold,
               SUM(item.UnitPrice * item.Quantity) AS revenue
        FROM dbo.MiraOrderItems AS item
        INNER JOIN dbo.MiraOrders AS orders ON orders.OrderId=item.OrderId
        WHERE orders.Status <> 'Cancelled'
        GROUP BY item.ProductId, item.ProductName
        ORDER BY unitsSold DESC, revenue DESC
      `),
      pool.request().query(`
        SELECT TOP 8 OrderId, CustomerName, TotalAmount, Status, CreatedAt
        FROM dbo.MiraOrders ORDER BY CreatedAt DESC
      `),
    ]);
    res.json({
      success: true,
      data: {
        ...totals.recordset[0],
        revenueByDay: revenue.recordset,
        topProducts: topProducts.recordset,
        recentOrders: recentOrders.recordset,
      },
    });
  } catch (error) {
    console.error("Admin dashboard:", error.message);
    res.status(500).json({ success: false, message: "Không tải được số liệu tổng quan." });
  }
});
app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    await ensureTables(pool);
    const result = await pool.request().query(`
      SELECT UserId, FullName, Email, Role, IsActive, CreatedAt
      FROM dbo.MiraUsers ORDER BY CreatedAt DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error("Admin users:", error.message);
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
  if (userId === req.user.userId &&
      (role === "Customer" || isActive === false))
    return res.status(400).json({ success: false, message: "Không thể tự hạ quyền hoặc vô hiệu hóa tài khoản đang đăng nhập." });
  let transaction;
  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const current = await new sql.Request(transaction)
      .input("id", sql.Int, userId)
      .query("SELECT UserId,Role,IsActive FROM dbo.MiraUsers WITH (UPDLOCK,HOLDLOCK) WHERE UserId=@id");
    const target = current.recordset[0];
    if (!target) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }
    const nextRole = role ?? target.Role;
    const nextIsActive = isActive ?? target.IsActive;
    if (target.Role === "Admin" && target.IsActive &&
        (nextRole !== "Admin" || !nextIsActive)) {
      const admins = await new sql.Request(transaction).query(
        "SELECT COUNT(*) AS count FROM dbo.MiraUsers WITH (UPDLOCK,HOLDLOCK) WHERE Role='Admin' AND IsActive=1"
      );
      if (admins.recordset[0].count <= 1) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Cần giữ lại ít nhất một Admin đang hoạt động." });
      }
    }
    await new sql.Request(transaction)
      .input("id", sql.Int, userId)
      .input("role", sql.NVarChar(20), nextRole)
      .input("isActive", sql.Bit, nextIsActive)
      .query("UPDATE dbo.MiraUsers SET Role=@role,IsActive=@isActive WHERE UserId=@id");
    await transaction.commit();
    res.json({ success: true, data: { UserId: userId, Role: nextRole, IsActive: nextIsActive } });
  } catch (error) {
    if (transaction) {
      try { await transaction.rollback(); } catch {}
    }
    console.error("Admin update user:", error.message);
    res.status(500).json({ success: false, message: "Không cập nhật được người dùng." });
  }
});
app.post("/api/admin/products", requireAuth, requireAdmin, async (req, res) => {
  const p = req.body;
  if (!String(p.ProductName || "").trim() || !Number.isFinite(Number(p.Price)) || Number(p.Price) < 0)
    return res.status(400).json({ success: false, message: "Tên sản phẩm và giá hợp lệ là bắt buộc." });
  try {
    const pool = await getPool();
    const r = await pool.request().input("cat", sql.Int, Number(p.CategoryId) || 1)
      .input("name", sql.NVarChar(255), String(p.ProductName).trim()).input("brand", sql.NVarChar(150), p.Brand || "")
      .input("desc", sql.NVarChar(sql.MAX), p.Description || "").input("price", sql.Decimal(18,2), Number(p.Price))
      .input("stock", sql.Int, Math.max(0, Number(p.StockQuantity) || 0)).input("image", sql.NVarChar(1000), p.ImageUrl || "/images/product-serum.jpg")
      .query("INSERT INTO dbo.Products(CategoryId,ProductName,Brand,Description,Price,StockQuantity,ImageUrl,IsActive,CreatedAt) OUTPUT INSERTED.ProductId VALUES(@cat,@name,@brand,@desc,@price,@stock,@image,1,SYSUTCDATETIME())");
    res.status(201).json({ success: true, data: { ProductId: r.recordset[0].ProductId } });
  } catch (error) { console.error("Admin create product:", error.message); res.status(500).json({ success: false, message: "Không thêm được sản phẩm. Kiểm tra cấu trúc bảng dbo.Products." }); }
});
app.put("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res) => {
  const p = req.body;
  try {
    const pool = await getPool();
    const r = await pool.request().input("id", sql.Int, Number(req.params.id)).input("cat", sql.Int, Number(p.CategoryId) || 1)
      .input("name", sql.NVarChar(255), String(p.ProductName || "").trim()).input("brand", sql.NVarChar(150), p.Brand || "")
      .input("desc", sql.NVarChar(sql.MAX), p.Description || "").input("price", sql.Decimal(18,2), Number(p.Price))
      .input("stock", sql.Int, Math.max(0, Number(p.StockQuantity) || 0)).input("image", sql.NVarChar(1000), p.ImageUrl || "/images/product-serum.jpg")
      .query("UPDATE dbo.Products SET CategoryId=@cat,ProductName=@name,Brand=@brand,Description=@desc,Price=@price,StockQuantity=@stock,ImageUrl=@image WHERE ProductId=@id");
    res.json({ success: true, rowsAffected: r.rowsAffected[0] });
  } catch (error) { console.error("Admin update product:", error.message); res.status(500).json({ success: false, message: "Không cập nhật được sản phẩm." }); }
});
app.delete("/api/admin/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().input("id", sql.Int, Number(req.params.id))
      .query("UPDATE dbo.Products SET IsActive=0 WHERE ProductId=@id");
    res.json({ success: true, rowsAffected: r.rowsAffected[0] });
  } catch (error) { res.status(500).json({ success: false, message: "Không ẩn được sản phẩm." }); }
});
app.get("/api/admin/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool(); await ensureTables(pool);
    const r = await pool.request().query("SELECT OrderId,UserId,CustomerName,Phone,Address,TotalAmount,Status,CreatedAt FROM dbo.MiraOrders ORDER BY CreatedAt DESC");
    res.json({ success: true, data: r.recordset });
  } catch (error) { res.status(500).json({ success: false, message: "Không tải được đơn hàng." }); }
});
app.patch("/api/admin/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  const allowed = ["Pending","Confirmed","Shipping","Completed","Cancelled"];
  const status = String(req.body.status || "");
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Trạng thái đơn hàng không hợp lệ." });
  try {
    const pool = await getPool();
    const r = await pool.request().input("id", sql.Int, Number(req.params.id)).input("status", sql.NVarChar(30), status)
      .query("UPDATE dbo.MiraOrders SET Status=@status WHERE OrderId=@id");
    res.json({ success: true, rowsAffected: r.rowsAffected[0] });
  } catch (error) { res.status(500).json({ success: false, message: "Không cập nhật được trạng thái đơn hàng." }); }
});


async function seedAdminFromEnvironment() {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!email || password.length < 12) return;
  try {
    const pool = await getPool(); await ensureTables(pool);
    const found = await pool.request().input("email", sql.NVarChar(255), email)
      .query("SELECT UserId FROM dbo.MiraUsers WHERE Email=@email");
    if (found.recordset.length) {
      await pool.request().input("email", sql.NVarChar(255), email)
        .query("UPDATE dbo.MiraUsers SET Role='Admin' WHERE Email=@email");
    } else {
      const { salt, hash } = hashPassword(password);
      await pool.request().input("name", sql.NVarChar(150), "MIRA Administrator")
        .input("email", sql.NVarChar(255), email).input("hash", sql.NVarChar(255), hash)
        .input("salt", sql.NVarChar(255), salt)
        .query("INSERT INTO dbo.MiraUsers(FullName,Email,PasswordHash,PasswordSalt,Role) VALUES(@name,@email,@hash,@salt,'Admin')");
    }
    console.log("MIRA admin account initialized from environment.");
  } catch (error) { console.error("Admin initialization skipped:", error.message); }
}

// Serve the built React/Vite application from the same Express process.
const frontendDist = path.resolve(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

// React Router / client-side routes: send non-API paths to index.html.
app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
  res.sendFile(path.join(frontendDist, "index.html"), (error) => {
    if (error) next(error);
  });
});

// Initialize the optional Admin account, then start listening.
// The API still starts if the database is temporarily unavailable; /api/db-check
// reports the database state separately.
(async () => {
  await seedAdminFromEnvironment();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MIRA Beauty Shop is running on port ${PORT}`);
  });
})();

import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";

export const dynamic = "force-dynamic";
const slugify = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clean = (p) => ({ name: String(p.name || "").trim(), slug: slugify(p.slug || p.name), category: String(p.category || "Chăm sóc da"), price: Number(p.price), oldPrice: Number(p.oldPrice || p.price), rating: Number(p.rating || 5), stock: Number(p.stock || 0), badge: String(p.badge || ""), image: String(p.image || ""), desc: String(p.desc || ""), active: p.active !== false, updatedAt: new Date() });

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const filter = { active: { $ne: false } };
    if (category && category !== "Tất cả") filter.category = category;
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    const products = await db.collection("products").find(filter).sort({ createdAt: -1, name: 1 }).toArray();
    return NextResponse.json({ products: products.map(p => ({ ...p, id: p._id.toString(), _id: undefined })) });
  } catch (error) {
    console.error("GET /api/products", error);
    return NextResponse.json({ error: "Không thể đọc sản phẩm từ MongoDB. Kiểm tra cấu hình database." }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    // Bảo vệ tối thiểu: chỉ cho phép ghi khi ADMIN_API_KEY được cấu hình và gửi đúng header.
    const key = process.env.ADMIN_API_KEY;
    if (!key || request.headers.get("x-admin-api-key") !== key) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 401 });
    const body = await request.json();
    const product = clean(body);
    if (!product.name || !product.image || !Number.isFinite(product.price) || product.price < 0 || !Number.isFinite(product.stock) || product.stock < 0) return NextResponse.json({ error: "Tên, ảnh, giá và tồn kho không hợp lệ." }, { status: 400 });
    const db = await getDb();
    await db.collection("products").createIndex({ slug: 1 }, { unique: true, name: "products_slug_unique" });
    const duplicate = await db.collection("products").findOne({ $or: [{ name: product.name }, { slug: product.slug }] });
    if (duplicate) return NextResponse.json({ error: "Tên sản phẩm đã tồn tại." }, { status: 409 });
    const result = await db.collection("products").insertOne({ ...product, createdAt: new Date() });
    return NextResponse.json({ id: result.insertedId.toString(), message: "Đã thêm sản phẩm." }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products", error);
    return NextResponse.json({ error: "Không thể thêm sản phẩm." }, { status: 500 });
  }
}

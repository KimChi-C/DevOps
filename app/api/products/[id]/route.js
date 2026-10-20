import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";

const authorized = (request) => Boolean(process.env.ADMIN_API_KEY) && request.headers.get("x-admin-api-key") === process.env.ADMIN_API_KEY;
function parseId(id) { return ObjectId.isValid(id) ? new ObjectId(id) : null; }
export async function GET(_request, { params }) {
  try {
    const id = parseId(params.id);
    if (!id) return NextResponse.json({ error: "Mã sản phẩm không hợp lệ." }, { status: 400 });
    const db = await getDb();
    const p = await db.collection("products").findOne({ _id: id, active: { $ne: false } });
    if (!p) return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    return NextResponse.json({ product: { ...p, id: p._id.toString(), _id: undefined } });
  } catch { return NextResponse.json({ error: "Không thể đọc sản phẩm." }, { status: 503 }); }
}
export async function PATCH(request, { params }) {
  if (!authorized(request)) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 401 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Mã sản phẩm không hợp lệ." }, { status: 400 });
  try {
    const body = await request.json();
    const fields = {};
    for (const key of ["name", "slug", "category", "price", "oldPrice", "rating", "stock", "badge", "image", "desc", "active"]) if (body[key] !== undefined) fields[key] = body[key];
    if (fields.price !== undefined) fields.price = Number(fields.price);
    if (fields.oldPrice !== undefined) fields.oldPrice = Number(fields.oldPrice);
    if (fields.stock !== undefined) fields.stock = Number(fields.stock);
    fields.updatedAt = new Date();
    const db = await getDb();
    const result = await db.collection("products").updateOne({ _id: id }, { $set: fields });
    if (!result.matchedCount) return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    return NextResponse.json({ message: "Đã cập nhật sản phẩm." });
  } catch { return NextResponse.json({ error: "Không thể cập nhật sản phẩm." }, { status: 500 }); }
}
export async function DELETE(request, { params }) {
  if (!authorized(request)) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 401 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Mã sản phẩm không hợp lệ." }, { status: 400 });
  try {
    const db = await getDb();
    const result = await db.collection("products").updateOne({ _id: id }, { $set: { active: false, updatedAt: new Date() } });
    if (!result.matchedCount) return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    return NextResponse.json({ message: "Đã ẩn sản phẩm." });
  } catch { return NextResponse.json({ error: "Không thể ẩn sản phẩm." }, { status: 500 }); }
}

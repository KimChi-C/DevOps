import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";
const MIME_EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" };
export async function POST(request) {
  if (!process.env.ADMIN_API_KEY || request.headers.get("x-admin-api-key") !== process.env.ADMIN_API_KEY) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ error: "Vui lòng chọn file ảnh." }, { status: 400 });
    const ext = MIME_EXT[file.type];
    if (!ext) return NextResponse.json({ error: "Chỉ hỗ trợ JPG, PNG, WEBP hoặc AVIF." }, { status: 415 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Ảnh không được vượt quá 5 MB." }, { status: 413 });
    const filename = `${crypto.randomUUID()}${ext}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    return NextResponse.json({ image: `/api/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload", error);
    return NextResponse.json({ error: "Không thể lưu ảnh." }, { status: 500 });
  }
}

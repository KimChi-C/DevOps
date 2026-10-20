import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const TYPES = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };
export async function GET(_request, { params }) {
  const filename = params.filename;
  if (!/^[a-f0-9-]+\.(jpg|png|webp|avif)$/i.test(filename)) return new NextResponse("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "uploads", filename));
    return new NextResponse(bytes, { headers: { "Content-Type": TYPES[path.extname(filename).toLowerCase()], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new NextResponse("Not found", { status: 404 }); }
}

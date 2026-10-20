"use client";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { CATEGORIES, formatVND } from "../../lib/constants";

const EMPTY = { name: "", slug: "", category: "Chăm sóc da", price: "", oldPrice: "", rating: "5", stock: "0", badge: "", image: "", desc: "", active: true };
export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setApiKey(sessionStorage.getItem("mira_admin_api_key") || ""); }, []);
  useEffect(() => { loadProducts(); }, []);
  async function loadProducts() {
    try { const r = await fetch("/api/products", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setProducts(d.products || []); }
    catch (e) { setMessage(e.message || "Không tải được dữ liệu."); }
  }
  function saveKey(value) { setApiKey(value); sessionStorage.setItem("mira_admin_api_key", value); }
  function edit(p) { setEditingId(p.id); setForm({ ...EMPTY, ...p, price: String(p.price), oldPrice: String(p.oldPrice), rating: String(p.rating), stock: String(p.stock) }); setFile(null); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function uploadImage() {
    if (!file) return form.image;
    const data = new FormData(); data.append("image", file);
    const r = await fetch("/api/upload", { method: "POST", headers: { "x-admin-api-key": apiKey }, body: data });
    const result = await r.json(); if (!r.ok) throw new Error(result.error || "Upload ảnh thất bại"); return result.image;
  }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const image = await uploadImage();
      if (!image) throw new Error("Vui lòng chọn ảnh hoặc nhập đường dẫn ảnh.");
      const payload = { ...form, image, slug: form.slug || form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), price: Number(form.price), oldPrice: Number(form.oldPrice || form.price), rating: Number(form.rating), stock: Number(form.stock) };
      const r = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json", "x-admin-api-key": apiKey }, body: JSON.stringify(payload) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Không lưu được sản phẩm");
      setMessage(d.message || "Đã lưu sản phẩm."); setForm(EMPTY); setEditingId(""); setFile(null); await loadProducts();
    } catch (e) { setMessage(e.message || "Có lỗi xảy ra."); } finally { setBusy(false); }
  }
  async function hideProduct(p) {
    if (!confirm(`Ẩn sản phẩm “${p.name}” khỏi cửa hàng?`)) return;
    try { const r = await fetch(`/api/products/${p.id}`, { method: "DELETE", headers: { "x-admin-api-key": apiKey } }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setMessage(d.message); await loadProducts(); }
    catch (e) { setMessage(e.message); }
  }
  return <><Header/><main className="container"><div className="pageTitle"><div className="eyebrow">MIRA ADMIN</div><h1>Quản lý sản phẩm</h1><p className="muted"></p></div>
    <section className="panel form" style={{ marginBottom: 24 }}><label>Admin API key<input type="password" autoComplete="current-password" value={apiKey} onChange={e => saveKey(e.target.value)} placeholder="Nhập ADMIN_API_KEY trong .env"/></label><p className="muted"></p></section>
    {message && <div className="notice" style={{ marginBottom: 20 }}>{message}</div>}
    <section className="panel" style={{ marginBottom: 28 }}><h2>{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2><form className="form" onSubmit={submit}>
      <label>Tên sản phẩm<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
      <div className="two"><label>Danh mục<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.filter(x => x !== "Tất cả").map(x => <option key={x}>{x}</option>)}</select></label><label>Nhãn<input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Mới, Bán chạy..."/></label></div>
      <div className="two"><label>Giá bán (VND)<input required min="0" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}/></label><label>Giá cũ (VND)<input min="0" type="number" value={form.oldPrice} onChange={e => setForm({ ...form, oldPrice: e.target.value })}/></label></div>
      <div className="two"><label>Tồn kho<input required min="0" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}/></label><label>Đánh giá<input min="0" max="5" step="0.1" type="number" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}/></label></div>
      <label>Chọn ảnh từ máy (JPG, PNG, WEBP, AVIF; tối đa 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => setFile(e.target.files?.[0] || null)}/></label>
      {file && <p className="muted">Ảnh đã chọn: {file.name}</p>}
      <label>Hoặc đường dẫn ảnh<input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="/uploads/ten-anh.webp hoặc URL https://..."/></label>
      <label>Mô tả<textarea rows="4" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}/></label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn accent" disabled={busy || !apiKey}>{busy ? "Đang lưu..." : editingId ? "Cập nhật sản phẩm" : "Cập nhật"}</button>{editingId && <button type="button" className="btn light" onClick={() => { setForm(EMPTY); setEditingId(""); setFile(null); }}>Hủy sửa</button>}</div>
    </form></section>
    <section className="panel"><div className="sectionHead"><h2>Sản phẩm trong database ({products.length})</h2><button className="pill" onClick={loadProducts}>Làm mới</button></div><div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn</th><th>Thao tác</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td><img src={p.image} alt="" width="54" height="54" style={{ objectFit: "cover", borderRadius: 8 }}/></td><td>{p.name}</td><td>{p.category}</td><td>{formatVND(p.price)}</td><td>{p.stock}</td><td><button className="pill" onClick={() => edit(p)}>Sửa</button> <button className="pill" onClick={() => hideProduct(p)}>Ẩn</button></td></tr>)}</tbody></table></div>{!products.length && <p className="muted">Chưa có dữ liệu. Hãy chạy npm run seed hoặc thêm sản phẩm bằng biểu mẫu phía trên.</p>}</section>
  </main></>;
}

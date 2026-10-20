"use client";
import Header from "../../components/Header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatVND } from "../../lib/constants";
export default function Profile() {
  const [user, setUser] = useState(null), [wishlist, setWishlist] = useState([]), [orders, setOrders] = useState([]), [products, setProducts] = useState([]);
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("mira_user") || "null"));
    setWishlist(JSON.parse(localStorage.getItem("mira_wishlist") || "[]"));
    setOrders(JSON.parse(localStorage.getItem("mira_orders") || "[]"));
    fetch("/api/products", { cache: "no-store" }).then(r => r.json()).then(d => setProducts(d.products || [])).catch(console.error);
  }, []);
  if (!user) return <><Header/><main className="container"><div className="empty"><h2>Bạn chưa đăng nhập</h2><Link className="btn accent" href="/login">Đăng nhập</Link></div></main></>;
  return <><Header/><main className="container"><div className="pageTitle"><div className="eyebrow">MY ACCOUNT</div><h1>Tài khoản</h1></div><div className="userbox"><div className="avatar">{user.name?.[0]}</div><div><b>{user.name}</b><div className="muted">{user.email}</div></div></div><div className="adminnav"><Link className="pill" href="/orders">Đơn hàng ({orders.length})</Link>{user.role === "admin" && <Link className="pill" href="/admin">Quản trị cửa hàng</Link>}<button className="pill" onClick={() => { localStorage.removeItem("mira_user"); location.href = "/"; }}>Đăng xuất</button></div><section className="section"><div className="sectionHead"><h2>Sản phẩm yêu thích</h2></div><div className="grid">{products.filter(p => wishlist.includes(p.id) || wishlist.includes(p._id)).map(p => <Link href={`/product/${p.id}`} className="panel" key={p.id}><img src={p.image} alt={p.name} width="100%" style={{ maxHeight: 160, objectFit: "cover" }}/><b>{p.name}</b><p>{formatVND(p.price)}</p></Link>)}</div></section></main></>;
}


"use client";

import Header from "../../components/Header";
import { formatVND } from "../../lib/constants";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [done, setDone] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "COD",
    note: "",
  });

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("mira_cart") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.qty),
    0
  );
  const ship = subtotal >= 499000 ? 0 : 30000;
  const total = subtotal + ship;

  async function submit(e) {
    e.preventDefault();
    if (busy || !items.length) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            qty: Number(item.qty),
          })),
          customer: form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể đặt hàng.");
      }

      setOrderCode(data.order.orderCode);
      localStorage.removeItem("mira_cart");
      window.dispatchEvent(new Event("mira-update"));
      setDone(true);
    } catch (error) {
      setMessage(error.message || "Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="empty">
            <div style={{ fontSize: 50 }}>✓</div>
            <h1>Đặt hàng thành công!</h1>
            <p>Mã đơn hàng: <strong>{orderCode}</strong></p>
            <p className="muted">
              Đơn hàng đã được lưu. MIRA sẽ liên hệ để xác nhận.
            </p>
            <button
              className="btn accent"
              onClick={() => router.push("/orders")}
            >
              Xem đơn hàng
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="pageTitle">
          <div className="eyebrow">CHECKOUT</div>
          <h1>Thanh toán</h1>
        </div>

        {!items.length ? (
          <div className="empty">Chưa có sản phẩm để thanh toán.</div>
        ) : (
          <div className="layout2">
            <form className="panel form" onSubmit={submit}>
              <h3>Thông tin giao hàng</h3>

              <label>
                Họ và tên
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </label>

              <div className="two">
                <label>
                  Số điện thoại
                  <input
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </label>

                <label>
                  Tỉnh/Thành phố
                  <input
                    required
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                Địa chỉ nhận hàng
                <textarea
                  required
                  value={form.note}
                  placeholder="Số nhà, đường, phường/xã..."
                  onChange={(e) =>
                    setForm({ ...form, note: e.target.value })
                  }
                />
              </label>

              <label>
                Phương thức thanh toán
                <select
                  value={form.payment}
                  onChange={(e) =>
                    setForm({ ...form, payment: e.target.value })
                  }
                >
                  <option value="COD">
                    Thanh toán khi nhận hàng (COD)
                  </option>
                  <option value="BANK">
                    Chuyển khoản ngân hàng
                  </option>
                </select>
              </label>

              {message && (
                <div className="notice" role="alert">{message}</div>
              )}

              <button className="btn accent" disabled={busy}>
                {busy ? "Đang đặt hàng..." : `Đặt hàng · ${formatVND(total)}`}
              </button>
            </form>

            <aside className="panel">
              <h3>Đơn hàng</h3>

              {items.map((item, index) => (
                <div className="total" key={item.id || index}>
                  <span>{item.name} × {item.qty}</span>
                  <b>{formatVND(item.price * item.qty)}</b>
                </div>
              ))}

              <div className="total">
                <span>Giao hàng</span>
                <b>{ship ? "30.000đ" : "Miễn phí"}</b>
              </div>

              <div className="total grand">
                <span>Tổng</span>
                <b>{formatVND(total)}</b>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

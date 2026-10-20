
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { formatVND } from "../../lib/constants";

const STATUSES = [
  "Chờ xác nhận",
  "Đã xác nhận",
  "Đang giao",
  "Đã giao",
  "Đã hủy",
];

export default function AdminOrdersPage() {
  const [apiKey, setApiKey] = useState("");
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedKey = sessionStorage.getItem("mira_admin_api_key") || "";
    setApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (apiKey) {
      loadOrders(apiKey);
    }
    // Chỉ tự tải khi khởi tạo API key đã lưu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveKey(value) {
    setApiKey(value);
    sessionStorage.setItem("mira_admin_api_key", value);
  }

  async function loadOrders(key = apiKey) {
    if (!key.trim()) {
      setMessage("Vui lòng nhập Admin API key.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
        headers: {
          "x-admin-api-key": key.trim(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Không tải được danh sách đơn hàng."
        );
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setLoaded(true);
      setMessage(
        `Đã tải ${Array.isArray(data.orders) ? data.orders.length : 0} đơn hàng.`
      );
    } catch (error) {
      setOrders([]);
      setLoaded(false);
      setMessage(error.message || "Có lỗi khi tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(order, status) {
    if (!apiKey.trim()) {
      setMessage("Vui lòng nhập Admin API key.");
      return;
    }

    if (status === "Đã hủy") {
      const confirmed = window.confirm(
        `Bạn có chắc muốn hủy đơn ${order.orderCode || order.id}?`
      );

      if (!confirmed) return;
    }

    setBusyId(order.id);
    setMessage("");

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-api-key": apiKey.trim(),
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Cập nhật trạng thái đơn hàng thất bại."
        );
      }

      setMessage(data.message || "Đã cập nhật trạng thái đơn hàng.");
      await loadOrders(apiKey);
    } catch (error) {
      setMessage(error.message || "Có lỗi khi cập nhật đơn hàng.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <Header />

      <main className="container">
        <div className="pageTitle">
          <div className="eyebrow">MIRA ADMIN</div>
          <h1>Duyệt đơn hàng</h1>

          <p className="muted">
            Tổng số đơn hàng: {orders.length}
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <Link href="/admin" className="btn light">
              Quản lý sản phẩm
            </Link>

            <button
              type="button"
              className="btn accent"
              onClick={() => loadOrders()}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Làm mới đơn hàng"}
            </button>
          </div>
        </div>

        <section
          className="panel form"
          style={{ marginBottom: 24 }}
        >
          <label>
            Admin API key
            <input
              type="password"
              autoComplete="current-password"
              value={apiKey}
              onChange={(event) => saveKey(event.target.value)}
              placeholder="Nhập ADMIN_API_KEY trong .env"
            />
          </label>

          <button
            type="button"
            className="btn accent"
            disabled={!apiKey.trim() || loading}
            onClick={() => loadOrders(apiKey)}
          >
            {loading ? "Đang tải..." : "Tải đơn hàng"}
          </button>
        </section>

        {message && (
          <div
            className="notice"
            role="status"
            style={{ marginBottom: 20 }}
          >
            {message}
          </div>
        )}

        <section className="panel">
          <div className="sectionHead">
            <h2>Danh sách đơn hàng</h2>
            <span>{orders.length} đơn</span>
          </div>

          {loading && orders.length === 0 ? (
            <p className="muted">Đang tải đơn hàng...</p>
          ) : !loaded && orders.length === 0 ? (
            <p className="muted">
              Nhập Admin API key rồi nhấn Tải đơn hàng để xem dữ liệu.
            </p>
          ) : orders.length === 0 ? (
            <p className="muted">
              Chưa có đơn hàng nào trong cơ sở dữ liệu.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              {orders.map((order) => (
                <article
                  key={order.id}
                  style={{
                    border: "1px solid #e8e2df",
                    borderRadius: 12,
                    padding: 18,
                  }}
                >
                  <div className="sectionHead">
                    <div>
                      <h3>{order.orderCode || order.id}</h3>

                      <p className="muted">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString(
                              "vi-VN"
                            )
                          : "Không có ngày tạo"}
                      </p>
                    </div>

                    <strong>{order.status || "Chờ xác nhận"}</strong>
                  </div>

                  <p>
                    <b>Khách hàng:</b>{" "}
                    {order.customer?.name || "Chưa có thông tin"}
                  </p>

                  <p>
                    <b>Số điện thoại:</b>{" "}
                    {order.customer?.phone || "Chưa có thông tin"}
                  </p>

                  <p>
                    <b>Tỉnh/Thành phố:</b>{" "}
                    {order.customer?.address || "Chưa có thông tin"}
                  </p>

                  <p>
                    <b>Địa chỉ chi tiết:</b>{" "}
                    {order.customer?.note || "Chưa có thông tin"}
                  </p>

                  <p>
                    <b>Thanh toán:</b>{" "}
                    {order.customer?.payment === "BANK"
                      ? "Chuyển khoản ngân hàng"
                      : "Thanh toán khi nhận hàng (COD)"}
                  </p>

                  <h4>Sản phẩm</h4>

                  {(order.items || []).map((item, index) => (
                    <div
                      className="total"
                      key={item.productId || item.id || index}
                    >
                      <span>
                        {item.name || "Sản phẩm"} × {item.qty}
                      </span>

                      <b>
                        {formatVND(
                          item.subtotal ??
                            Number(item.price || 0) *
                              Number(item.qty || 0)
                        )}
                      </b>
                    </div>
                  ))}

                  <div className="total">
                    <span>Phí giao hàng</span>
                    <b>{formatVND(Number(order.shipping || 0))}</b>
                  </div>

                  <div className="total grand">
                    <span>Tổng đơn hàng</span>
                    <b>{formatVND(Number(order.total || 0))}</b>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 16,
                    }}
                  >
                    {STATUSES.map((status) => (
                      <button
                        type="button"
                        key={status}
                        className="pill"
                        disabled={
                          busyId === order.id ||
                          status === order.status
                        }
                        onClick={() => updateStatus(order, status)}
                      >
                        {busyId === order.id
                          ? "Đang lưu..."
                          : status}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

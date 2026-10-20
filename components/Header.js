
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [cart, setCart] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sync = () => {
      try {
        const cartData = JSON.parse(
          localStorage.getItem("mira_cart") || "[]"
        );

        setCart(
          cartData.reduce(
            (sum, item) => sum + (Number(item.qty) || 0),
            0
          )
        );

        setUser(
          JSON.parse(localStorage.getItem("mira_user") || "null")
        );
      } catch {
        setCart(0);
        setUser(null);
      }
    };

    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("mira-update", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("mira-update", sync);
    };
  }, []);

  return (
    <>
      <div className="topbar">
        Miễn phí giao hàng cho đơn từ 499.000đ · Đổi trả trong 7 ngày
      </div>

      <header className="header">
        <div className="container headrow">
          <Link href="/" className="brand">
            MIRA
            <small>BEAUTY &amp; LIFESTYLE</small>
          </Link>

          <nav className="nav">
            <Link href="/">Trang chủ</Link>
            <Link href="/?cat=Chăm sóc da">Chăm sóc da</Link>
            <Link href="/?cat=Trang điểm">Trang điểm</Link>
            <Link href="/?cat=Tóc">Tóc</Link>
            <Link href="/?cat=Phụ kiện">Phụ kiện</Link>
            <Link href="/?sale=1">Sale</Link>
          </nav>

          <div className="actions">
            <Link
              className="iconbtn"
              href="/profile"
              title="Tài khoản"
              aria-label="Tài khoản"
            >
              <svg
                width="27"
                height="27"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
            </Link>

            <Link
              className="iconbtn count"
              href="/cart"
              title="Giỏ hàng"
              aria-label={`Giỏ hàng, ${cart} sản phẩm`}
            >
              <svg
                width="27"
                height="27"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6" />
                <circle cx="10" cy="21" r="1" />
                <circle cx="18" cy="21" r="1" />
              </svg>

              <b>{cart}</b>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

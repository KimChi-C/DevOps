import "./globals.css";

export const metadata = {
  title: "MIRA Beauty — Beauty & Lifestyle Store",
  description: "Website bán mỹ phẩm và lifestyle với giỏ hàng, thanh toán, đơn hàng và quản trị.",
};

export default function RootLayout({ children }) {
  return <html lang="vi"><body>{children}</body></html>;
}

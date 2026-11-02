# MIRA Beauty Shop – MongoDB Atlas và Render/Vercel

Backend Express sử dụng MongoDB Atlas qua Mongoose. Frontend React/Vite tiếp tục deploy riêng trên Vercel và gọi backend Render qua `VITE_API_URL`.

## Local development

1. Copy `backend/.env.example` to `backend/.env` và điền `MONGODB_URI` thực của MongoDB Atlas.
2. Install dependencies:
   ```powershell
   npm run install:all
   ```
3. Start backend:
   ```powershell
   npm start
   ```
4. In another terminal, start Vite:
   ```powershell
   npm run dev:frontend
   ```
   For Vite development, configure `frontend/.env` with `VITE_API_URL=http://localhost:5000/api`.
5. Production-like local test:
   ```powershell
   npm run build
   npm start
   ```
   Open http://localhost:5000 and test http://localhost:5000/api/health.

## Render

Tạo Web Service với:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment:
  - `MONGODB_URI`: connection string MongoDB Atlas
  - `TOKEN_SECRET`: chuỗi ngẫu nhiên dài
  - `FRONTEND_URL`: danh sách origin frontend Vercel, ngăn cách bằng dấu phẩy
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD` nếu cần khởi tạo tài khoản admin

Trong Atlas, cho phép IP truy cập Render (Atlas Network Access); nếu dùng IP allowlist, Render có thể cần `0.0.0.0/0` hoặc Static Egress IP phù hợp gói dịch vụ.

## Vercel

Thêm biến môi trường:
- `VITE_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api`

Sau đó build lại frontend. Không đưa connection string MongoDB hoặc secret vào biến `VITE_*`.

## Migration dữ liệu SQL sang MongoDB

1. Xuất dữ liệu thật từ các bảng `MiraUsers`, `Products`, `MiraOrders` và `MiraOrderItems` thành JSON.
2. Đặt các file đúng tên: `MiraUsers.json`, `Products.json`, `MiraOrders.json`, `MiraOrderItems.json`.
3. Trong `backend/.env`, đặt `MONGODB_URI` và `SQL_EXPORT_DIR` trỏ tới thư mục export.
4. Chạy: `npm --prefix backend run migrate:mongo`.

Script dùng upsert theo `UserId`, `ProductId` và `OrderId`; nó không tạo dữ liệu mẫu.

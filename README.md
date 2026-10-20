# MIRA Beauty Shop

Ứng dụng Next.js 14 + MongoDB cho cửa hàng mỹ phẩm. Sản phẩm được đọc/ghi qua API và lưu trong MongoDB; ảnh có thể tải thủ công từ trang quản trị.

## Yêu cầu
- Node.js 20+
- Docker Desktop / Docker Compose

## Chạy local bằng Docker
1. Sao chép `.env.example` thành `.env`.
2. Đặt `ADMIN_API_KEY` thành chuỗi bí mật ngẫu nhiên dài. Không commit `.env`.
3. Chạy `docker compose up --build -d`.
4. Trên máy host, chạy `npm install` rồi `npm run seed` (MongoDB được publish cục bộ ở `127.0.0.1:27017`) để nhập dữ liệu khởi tạo. Lệnh seed chỉ thêm sản phẩm còn thiếu theo `slug`, không ghi đè sản phẩm hiện có.
5. Mở http://localhost:3000 và trang quản trị tại http://localhost:3000/admin. Nhập cùng giá trị `ADMIN_API_KEY` đã đặt trong `.env`.

## MongoDB
- Local Docker URI trong container: `mongodb://mongo:27017/mira_beauty`.
- MongoDB Atlas: đặt `MONGODB_URI` thành connection string Atlas và cấu hình network access/database user trong Atlas.
- Database mặc định: `mira_beauty`; collection sản phẩm: `products`.

## API sản phẩm
- `GET /api/products` — danh sách; hỗ trợ `?category=` và `?q=`.
- `GET /api/products/:id` — chi tiết theo MongoDB ObjectId.
- `POST /api/products` — thêm sản phẩm; cần header `x-admin-api-key`.
- `PATCH /api/products/:id` — cập nhật; cần header `x-admin-api-key`.
- `DELETE /api/products/:id` — ẩn sản phẩm (soft delete); cần header `x-admin-api-key`.
- `POST /api/upload` — tải ảnh lên `public/uploads`; chỉ JPG, PNG, WEBP, AVIF tối đa 5 MB; cần header `x-admin-api-key`.

## Ảnh sản phẩm
Tải ảnh bằng biểu mẫu tại `/admin`. Tên file được tạo ngẫu nhiên để tránh trùng tên. Trong Docker Compose, thư mục `public/uploads` được mount từ máy chủ. Nếu triển khai lên nền tảng có filesystem tạm thời/ephemeral, hãy dùng dịch vụ lưu trữ ảnh bền vững (ví dụ object storage) trước khi vận hành production.

## Ghi chú quan trọng
Bản refactor này chuyển danh mục sản phẩm sang MongoDB và thêm quản lý sản phẩm/ảnh. Đăng ký, đăng nhập và đơn hàng trong giao diện cũ vẫn còn dùng `localStorage`; không dùng các chức năng đó để nhận dữ liệu khách hàng/đơn hàng thật trước khi chuyển chúng sang API có xác thực server-side. `ADMIN_API_KEY` là lớp bảo vệ đơn giản cho quản trị, phù hợp môi trường phát triển nội bộ; hệ thống production nên thay bằng session đăng nhập admin có phân quyền, rate limit và audit log.

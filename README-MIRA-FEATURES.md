# MIRA Beauty Shop — bản bổ sung chức năng

## Chức năng đã thêm
- Đăng ký / đăng nhập; mật khẩu lưu dạng hash `scrypt`, token có thời hạn.
- Chi tiết sản phẩm với lựa chọn số lượng, Thêm vào giỏ và Mua ngay.
- Thanh toán tạo đơn hàng trong MongoDB Atlas, kiểm tra tồn kho và trừ tồn trong transaction.
- Lịch sử đơn hàng của người dùng.
- Trang Admin: thêm/sửa/ẩn sản phẩm, xem đơn hàng và cập nhật trạng thái.
- Giữ giao diện, hình ảnh hiện có của MIRA.

## 1. Backend
Mở terminal ở thư mục `backend`:

```bash
npm install
```

Sao chép `.env.example` thành `.env` rồi điền MongoDB Atlas:
- `MONGODB_URI`: connection string Atlas thực tế.
- `TOKEN_SECRET`: thay bằng chuỗi bí mật ngẫu nhiên dài.
- `ADMIN_EMAIL` và `ADMIN_PASSWORD`: tài khoản quản trị. Mật khẩu admin phải dài tối thiểu 12 ký tự.

Backend sử dụng `MONGODB_URI` trong `backend/.env` để kết nối MongoDB Atlas qua Mongoose. Các collection dữ liệu gồm `Products`, `MiraUsers`, `MiraOrders`, `Categories`, `Carts` và `Counters`. Khi migrate dữ liệu SQL hiện có, giữ nguyên các trường `ProductId`, `UserId` và `OrderId` để API frontend giữ tương thích.

```bash
npm run dev
```

Kiểm tra `http://localhost:5000/api/health` và `http://localhost:5000/api/db-check`.

**Lưu ý bảo mật:** `.env` không được đóng gói trong ZIP. Không đưa file `.env` lên GitHub. Nếu mật khẩu/chuỗi kết nối trong bản cũ từng được chia sẻ công khai, hãy đổi chúng.

## 2. Tạo tài khoản Admin
1. Điền `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `backend/.env`.
2. Khởi động lại backend.
3. Đăng nhập bằng email/mật khẩu đó ở nút tài khoản trên website. Tài khoản sẽ có quyền Admin.

Không có nút tự đăng ký Admin trên giao diện. Người dùng tự đăng ký chỉ có vai trò Customer.

## 3. Frontend
Mở terminal ở thư mục `frontend`:

```bash
npm install
npm run dev
```

Mở URL Vite hiện ra, thường là `http://localhost:5173`.

## 4. Luồng mua hàng
- Nhấn ảnh/tên sản phẩm để mở chi tiết.
- Chọn số lượng, dùng **Thêm vào giỏ** hoặc **Mua ngay**.
- Điền thông tin giao hàng ở trang thanh toán.
- Đăng nhập trước khi xác nhận đặt hàng.
- Đơn hàng được ghi vào MongoDB Atlas và tồn kho được cập nhật bằng transaction Mongoose.

Bản này chưa tích hợp cổng thanh toán trực tuyến; đơn hàng tạo ở trạng thái `Pending` và Admin cập nhật trạng thái trong trang quản trị.

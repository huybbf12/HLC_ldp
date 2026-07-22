# Hoàng Long – Landing page nội soi trên Vercel

## Deploy bằng Vercel CLI

1. Cài Node.js nếu máy chưa có.
2. Mở Terminal/PowerShell tại thư mục này.
3. Đăng nhập Vercel bằng trình duyệt:

   ```bash
   npx vercel@latest login
   ```

4. Tạo bản xem thử:

   ```bash
   npx vercel@latest
   ```

5. Ở lần chạy đầu, chọn tài khoản/team của bạn, tạo project mới và giữ thư mục dự án là `./`. Landing page là HTML tĩnh nên không cần Build Command hay Output Directory riêng.
6. Mở URL Preview mà Vercel trả về để kiểm tra. Khi bản xem thử đã ổn, đưa lên production:

   ```bash
   npx vercel@latest --prod
   ```

Những lần cập nhật sau, chỉ cần thay `index.html`, mở Terminal tại thư mục này và chạy lại lệnh production ở trên.

## Deploy qua GitHub

1. Đưa ba file `index.html`, `vercel.json` và `README-DEPLOY.md` lên một repository GitHub.
2. Trong Vercel, chọn **Add New → Project → Import Git Repository**.
3. Giữ Framework Preset là **Other**, không đặt Build Command và nhấn **Deploy**.

Mỗi lần cập nhật `index.html` và push lên GitHub, Vercel sẽ tự tạo deployment mới.

## Gắn tên miền

Trong Vercel, mở project > Settings > Domains và thêm tên miền hoặc subdomain, ví dụ `noisoi.hoanglongclinic.vn`. Sau đó cập nhật bản ghi DNS theo giá trị Vercel cung cấp.

## Lưu ý trước khi chạy quảng cáo

- 16 ảnh cơ sở phòng khám đã được tối ưu WebP và đóng gói trong `assets/images/clinic/`, có thể hiển thị trực tiếp trên Vercel.
- QR Zalo OA đã được đóng gói trong `assets/images/qr/`; QR Mini App vẫn giữ ảnh chờ cho đến khi có file chính thức.
- Sáu ảnh dây soi đã được tối ưu WebP và đóng gói trong `assets/images/endoscopy/`; landing page không còn đường dẫn ảnh `file:///D:/...`.
- Ảnh nền hero đã được đóng gói cục bộ tại `assets/images/hero/`, không còn phụ thuộc vào link Facebook CDN.
- Form hiện chỉ hiển thị thông báo cảm ơn, chưa gửi dữ liệu về CRM, Google Sheets hoặc email.
- Nên bổ sung Google Analytics, Meta Pixel và theo dõi sự kiện gửi form trước khi chạy chiến dịch.

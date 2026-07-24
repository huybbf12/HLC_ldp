# Hoàng Long – Landing page nội soi trên Vercel

Landing page đã có luồng nhận đăng ký:

`Form trên website → Vercel Function /api/lead → Google Apps Script → Google Sheet + Gmail`

- Google Sheet đích: `1KgKKoN4qwxw4qmRHp6wMxUY0ZxNgkCUoVQYwOfwAPug`
- Email nhận thông báo: `hoanglongclinic.news@gmail.com`
- Tab dữ liệu được tự tạo: `Lead Landing Page`

## 1. Thiết lập Google Sheet và Gmail

Thao tác này cần thực hiện một lần bằng tài khoản Google có quyền chỉnh sửa Sheet.

1. Mở Google Sheet đích.
2. Chọn **Tiện ích mở rộng (Extensions) → Apps Script**.
3. Xóa nội dung mẫu trong `Code.gs`, sau đó sao chép toàn bộ nội dung file:

   `integrations/google-apps-script.gs`

4. Trong Apps Script, mở **Project Settings → Script Properties → Add script property**:

   - Property: `LEAD_WEBHOOK_SECRET`
   - Value: một chuỗi bí mật ngẫu nhiên dài tối thiểu 32 ký tự.

   Có thể tạo chuỗi bí mật trên máy bằng một trong hai lệnh:

   ```bash
   openssl rand -hex 32
   ```

   Hoặc PowerShell:

   ```powershell
   -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
   ```

5. Chọn **Deploy → New deployment → Select type: Web app**.
6. Cấu hình:

   - Execute as: **Me**
   - Who has access: **Anyone**

7. Nhấn **Deploy**, cấp quyền truy cập Google Sheet và gửi email khi Google hỏi.
8. Sao chép URL Web App kết thúc bằng `/exec`.

Apps Script chỉ chấp nhận yêu cầu có đúng secret. Không đăng secret hoặc URL cấu hình vào mã nguồn công khai.

## 2. Khai báo biến môi trường trên Vercel

Trong Vercel, mở project → **Settings → Environment Variables** và thêm:

| Tên biến | Giá trị |
|---|---|
| `GOOGLE_APPS_SCRIPT_URL` | URL Web App `/exec` vừa sao chép |
| `LEAD_WEBHOOK_SECRET` | Chuỗi secret giống hệt trong Script Properties |

Chọn **Production**. Nếu cần thử trên deployment Preview, chọn thêm **Preview**. Sau khi lưu biến, vào **Deployments** và Redeploy bản mới nhất.

Hai biến này chỉ tồn tại phía máy chủ; không đổi tên thành biến có tiền tố public và không commit file `.env` lên GitHub.

## 3. Kiểm tra sau khi triển khai

1. Mở `https://ten-mien-cua-ban/api/lead`.
2. Kết quả cần có dạng:

   ```json
   {
     "ok": true,
     "service": "Hoang Long lead endpoint",
     "configured": true
   }
   ```

3. Gửi thử form bằng số điện thoại thật.
4. Kiểm tra:

   - Tab `Lead Landing Page` trong Google Sheet có một dòng mới.
   - `hoanglongclinic.news@gmail.com` nhận được email thông báo.
   - Cột `Thông báo email` hiển thị `Đã gửi`.

Không dùng dữ liệu sức khỏe thật khi test. Sau khi kiểm tra xong, có thể đổi trạng thái lead hoặc xóa dòng thử.

## 4. Deploy bằng Vercel CLI

1. Cài Node.js nếu máy chưa có.
2. Mở Terminal/PowerShell tại thư mục dự án.
3. Đăng nhập:

   ```bash
   npx vercel@latest login
   ```

4. Tạo bản xem thử:

   ```bash
   npx vercel@latest
   ```

5. Ở lần đầu, chọn tài khoản/team, tạo project mới, giữ thư mục dự án là `./` và Framework Preset là **Other**.
6. Đưa lên production:

   ```bash
   npx vercel@latest --prod
   ```

## 5. Deploy qua GitHub

1. Đưa toàn bộ nội dung thư mục này lên repository, bao gồm `index.html`, `api/`, `assets/`, `integrations/`, `vercel.json` và các file cấu hình.
2. Trong Vercel, chọn **Add New → Project → Import Git Repository**.
3. Giữ Framework Preset là **Other**, không đặt Build Command hoặc Output Directory, rồi nhấn **Deploy**.

Mỗi lần push lên GitHub, Vercel sẽ tạo deployment mới. Nếu thay đổi biến môi trường, cần Redeploy để bản chạy mới nhận giá trị.

## 6. Xử lý sự cố

- `/api/lead` trả `"configured": false`: thiếu một hoặc cả hai biến môi trường trên Vercel, hoặc deployment chưa được tạo lại sau khi thêm biến.
- Form báo chưa thể gửi: kiểm tra URL Apps Script có kết thúc bằng `/exec`, deployment đang cho phép **Anyone**, và hai secret giống hệt nhau.
- Sheet có lead nhưng không có email: kiểm tra cột `Thông báo email`, quyền Gmail của Apps Script và hạn mức gửi email của tài khoản triển khai.
- Đã sửa Apps Script: chọn **Deploy → Manage deployments → Edit → New version → Deploy**. Lưu code thôi chưa cập nhật bản Web App đang chạy.
- Email vào Spam: đánh dấu “Không phải spam” và thêm địa chỉ gửi vào danh bạ.

## 7. Bảo mật và dữ liệu

- Form xác thực dữ liệu ở cả trình duyệt, Vercel Function và Apps Script.
- Có trường honeypot, chặn gửi quá nhanh và khóa nút trong lúc gửi để giảm spam/gửi trùng cơ bản.
- Dữ liệu bắt đầu bằng ký tự công thức được vô hiệu hóa trước khi ghi vào Sheet.
- Secret chỉ được lưu trong Vercel Environment Variables và Apps Script Script Properties.
- Chỉ cấp quyền Sheet/Gmail cho người phụ trách; không bật chia sẻ công khai Sheet.
- Nên xây dựng quy trình xóa lead cũ và chỉ thu thập thông tin thật sự cần cho việc tư vấn.

## 8. Tài nguyên hiện có

- 16 ảnh cơ sở phòng khám: `assets/images/clinic/`
- QR Zalo OA: `assets/images/qr/`
- Sáu ảnh dây soi: `assets/images/endoscopy/`
- Ảnh hero: `assets/images/hero/`
- Logo navbar/footer: `assets/images/brand/`
- Mã Apps Script để sao chép: `integrations/google-apps-script.gs`
- Biến môi trường mẫu: `.env.example`

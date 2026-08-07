# Hoàng Long – Landing page nội soi trên Vercel

Landing page đã có luồng nhận đăng ký:

`Form trên website → Vercel Function /api/lead → Google Apps Script → Google Sheet + Gmail`

- Google Sheet đích: `1KgKKoN4qwxw4qmRHp6wMxUY0ZxNgkCUoVQYwOfwAPug`
- Email nhận thông báo: `pkdk.hoanglong10@gmail.com`
- Tab dữ liệu được tự tạo: `Lead Landing Page`
- Mã tham chiếu dễ theo dõi: `HLC-NS-YYYYMMDD-001`

Mỗi ngày, phần số thứ tự bắt đầu lại từ `001`. UUID cũ vẫn được giữ trong cột `Mã hệ thống` để chống ghi trùng.

## Nâng cấp từ phiên bản đã hoạt động

Nếu landing page của bạn đang nhận được Sheet và email, không cần tạo lại secret hoặc deployment Apps Script:

1. Thay toàn bộ code hiện tại trong Apps Script bằng nội dung mới của `integrations/google-apps-script.gs`.
2. Trong danh sách hàm ở thanh công cụ Apps Script, chọn `prepareLeadSystem` rồi nhấn **Run** một lần. Hàm này chuẩn bị cấu trúc Sheet và bộ đếm trước khi khách gửi form.
3. Chọn **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Đẩy toàn bộ mã nguồn mới lên GitHub để Vercel tự triển khai, hoặc chạy `npx vercel@latest --prod`.
5. Gửi một form thử.

Lần nhận lead đầu tiên sau khi cập nhật, Apps Script sẽ:

- Chèn cột `Mã tham chiếu` vào đầu tab hiện tại.
- Đổi `Mã lead` cũ thành `Mã hệ thống`.
- Tạo mã tham chiếu cho các dòng cũ dựa trên ngày nhận lead.
- Tiếp tục đánh số an toàn cho lead mới mà không xóa hoặc ghi đè dữ liệu.
- Ghi nhớ phiên bản cấu trúc và bộ đếm, tránh quét lại toàn bộ Sheet trong mỗi lượt đăng ký.

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
| `TURNSTILE_SITE_KEY` | Site key của Cloudflare Turnstile cho domain landing page |
| `TURNSTILE_SECRET_KEY` | Secret key của Cloudflare Turnstile; chỉ lưu phía server |

Chọn **Production**. Nếu cần thử trên deployment Preview, chọn thêm **Preview**. Sau khi lưu biến, vào **Deployments** và Redeploy bản mới nhất.

`LEAD_WEBHOOK_SECRET` và `TURNSTILE_SECRET_KEY` là secret phía máy chủ; không nhúng chúng vào HTML/JavaScript và không commit file `.env` lên GitHub. `TURNSTILE_SITE_KEY` là khóa công khai dùng để hiển thị widget.

### Bật lớp chống spam Turnstile

1. Trong Cloudflare Dashboard, tạo một **Turnstile widget** và thêm domain production của landing page vào danh sách hostname được phép.
2. Chọn chế độ **Managed** để Cloudflare tự quyết định khi nào cần tương tác xác minh.
3. Sao chép **Site key** và **Secret key** vào hai biến Vercel ở bảng trên, sau đó Redeploy.
4. Mở `https://ten-mien-cua-ban/api/lead` và kiểm tra `turnstileConfigured` phải là `true`.
5. Cuộn tới form: widget chỉ được tải khi form sắp đi vào vùng nhìn hoặc người dùng bắt đầu tương tác, vì vậy không chen thêm script Turnstile vào critical path của hero/LCP.

Nếu cả hai biến Turnstile chưa được khai báo, form vẫn chạy theo cơ chế cũ để không làm gián đoạn website khi bạn đang cấu hình. Nếu chỉ khai báo một trong hai biến, API sẽ fail-closed và yêu cầu hoàn tất cấu hình thay vì âm thầm tắt chống spam.

### Các lớp chống spam đã áp dụng

- Turnstile được **xác minh lại tại `/api/lead`** trước khi dữ liệu đi tới Apps Script; token phía trình duyệt không được tin cậy trực tiếp.
- Honeypot và ngưỡng điền form tối thiểu 2 giây loại bot đơn giản mà không thêm bước cho người dùng thật.
- API từ chối POST có `Origin` khác domain hiện tại khi trình duyệt gửi header này.
- Google Apps Script bỏ qua số điện thoại đã được tiếp nhận trong **24 giờ gần nhất** (tối đa 500 lead gần nhất), không tạo thêm dòng Sheet hoặc email trùng.
- Lead trùng hoặc submission bị honeypot loại không phát sự kiện GA4 `generate_lead`, giúp số chuyển đổi sạch hơn.

### Rate limit ở Vercel Firewall

Sau khi bản mới chạy ổn định, nên bổ sung một rule rate limit cho đường dẫn `/api/lead` trong Vercel Firewall, ví dụ chỉ áp dụng cho request `POST` và giới hạn khoảng 5–10 lần/10 phút/IP. Không đặt ngưỡng quá thấp vì mạng cơ quan hoặc 4G có thể dùng chung IP. Đây là lớp bổ sung; Turnstile và chống trùng vẫn là lớp chính của form.

## 3. Kiểm tra sau khi triển khai

1. Mở `https://ten-mien-cua-ban/api/lead`.
2. Kết quả cần có dạng:

   ```json
   {
     "ok": true,
     "service": "Hoang Long lead endpoint",
     "configured": true,
     "turnstileConfigured": true
   }
   ```

3. Gửi thử form bằng số điện thoại thật.
4. Kiểm tra:

   - Tab `Lead Landing Page` trong Google Sheet có một dòng mới.
   - `pkdk.hoanglong10@gmail.com` nhận được email thông báo.
   - Cột `Mã tham chiếu` có dạng `HLC-NS-20260724-001`.
   - Form hiển thị thông báo thành công kèm biểu tượng tích; mã tham chiếu chỉ xuất hiện trong Sheet và email.
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
- `/api/lead` trả `"turnstileConfigured": false`: kiểm tra `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` và Redeploy. Nếu form báo lỗi xác minh, kiểm tra thêm hostname đã khai báo trong Turnstile.
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
- Font chữ nội bộ: `assets/fonts/`
- Giấy phép icon SVG nội bộ: `assets/icons/`
- Mã Apps Script để sao chép: `integrations/google-apps-script.gs`
- Biến môi trường mẫu: `.env.example`

## 9. Tối ưu hiệu suất đã áp dụng

- Google Fonts và Font Awesome CDN đã được loại khỏi đường tải quan trọng.
- Nunito và Be Vietnam Pro được phục vụ trực tiếp từ `assets/fonts/` với `font-display: optional`, tránh đổi font muộn làm kéo dài LCP.
- CSS biên dịch được tách sang `assets/css/landing-page.css`, giúp trình duyệt tải song song và cache độc lập thay vì phân tích toàn bộ trong HTML.
- Trang chỉ nhúng 25 biểu tượng SVG thật sự sử dụng, không tải hai webfont Font Awesome dung lượng lớn.
- Ảnh hero được preload và gắn `fetchpriority="high"`; không dùng `loading="lazy"`.
- Google Tag vẫn xếp hàng sự kiện ngay lập tức nhưng thư viện bên thứ ba chỉ tải sau tương tác đầu tiên hoặc sau khi trang đã ổn định.
- Hai ảnh nền trang trí bên ngoài chỉ tải sau nội dung chính hoặc khi người dùng sắp cuộn tới.
- Bộ đếm chạy ở 30 khung hình/giây và hoàn tất trong tối đa 1,4 giây; phép đo review chỉ bắt đầu khi section sắp xuất hiện.
- Timer slider và phép đo carousel bác sĩ chỉ kích hoạt khi người dùng cuộn gần tới section, giảm công việc main thread lúc tải đầu.
- Chiều cao trang được lưu tạm và chỉ cập nhật khi kích thước nội dung thay đổi, không đọc lại ở mọi sự kiện cuộn.

Khi đưa phiên bản này lên GitHub, phải giữ nguyên cả thư mục `assets/fonts/` và `assets/icons/`. Sau khi Vercel hoàn tất deployment mới, chạy lại PageSpeed Insights trên chính URL production để đo LCP trong điều kiện mạng thực tế.

## 10. Kiểm tra chuyển đổi GA4

Trang gửi ba sự kiện chính của form tới GA4 `G-GLBFPTHWG6`:

| Sự kiện | Thời điểm ghi nhận | Có nên đặt làm Key event? |
|---|---|---|
| `lead_submit_attempt` | Người dùng bấm gửi và form đã hợp lệ | Không; dùng để đo ý định gửi |
| `generate_lead` | `/api/lead` xác nhận đã lưu lead thành công | Có; đây là chuyển đổi thực |
| `lead_form_error` | Form sai dữ liệu, hết thời gian hoặc máy chủ lỗi | Không; dùng để chẩn đoán |

Để kiểm tra tức thời sau khi triển khai:

1. Mở URL production và thêm `?ga_debug=1` ở cuối, ví dụ `https://ten-mien-cua-ban/?ga_debug=1`.
2. Trong GA4, mở **Admin → Data display → DebugView**.
3. Điền form thử hợp lệ rồi bấm gửi.
4. DebugView cần hiện `lead_submit_attempt`; nếu Sheet/email nhận lead thành công thì hiện thêm `generate_lead`. Nếu chỉ thấy `lead_form_error`, kiểm tra chi tiết tham số `error_type`.
5. Trong GA4, mở **Admin → Data display → Events** và đánh dấu chính xác `generate_lead` là **Key event**. Không đánh dấu `lead_submit_attempt` để tránh tính các lượt gửi thất bại là chuyển đổi.

Chế độ debug chỉ được bật trên thiết bị có tham số `ga_debug=1`; trang production thông thường không ghi log debug. Các sự kiện GA4 không chứa họ tên, số điện thoại, ghi chú hay dịch vụ người dùng đã chọn.

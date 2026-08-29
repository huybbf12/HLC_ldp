# Hoàng Long – Landing page nội soi trên Vercel

Landing page đã có luồng nhận đăng ký:

`Form trên website → Vercel Function /api/lead → Google Apps Script → Google Sheet + Gmail`

- Google Sheet đích: `1KgKKoN4qwxw4qmRHp6wMxUY0ZxNgkCUoVQYwOfwAPug`
- Email nhận thông báo: `pkdk.hoanglong10@gmail.com` và `cskh@hoanglongclinic.vn`
- Tab dữ liệu được tự tạo: `Lead Landing Page`
- Mã tham chiếu dễ theo dõi: `HLC-NS-YYYYMMDD-001`
- Hai trường sàng lọc: `Tỉnh/Thành phố sinh sống` theo 34 đơn vị hành chính cấp tỉnh và `Ngày mong muốn thăm khám` bằng lịch chọn ngày

Mỗi ngày, phần số thứ tự bắt đầu lại từ `001`. UUID cũ vẫn được giữ trong cột `Mã hệ thống` để chống ghi trùng.

## V73 – rút gọn nhãn ảnh phòng MRI/CT

V73 giữ nguyên giao diện, form và toàn bộ luồng nhận đăng ký của V72, đồng thời:

- Bỏ hai chú thích `Phòng MRI thực tế` và `Phòng CT thực tế` bên dưới ảnh.
- Rút gọn nhãn thao tác trên cả hai ảnh từ `Xem ảnh lớn` thành `xem ảnh`.

Chỉ cần deploy toàn bộ thư mục V73 lên project Vercel hiện tại. Không cần thay đổi Google Apps Script, Google Sheet, biến môi trường, GA4, Google Ads hoặc Turnstile.

## V72 – chuẩn hóa cấu trúc truy cập

V72 giữ nguyên giao diện và toàn bộ luồng nhận đăng ký của V71, đồng thời:

- Bổ sung một vùng nội dung chính `<main>` bao quanh các section từ hero đến FAQ.
- Chuẩn hóa thứ tự tiêu đề, không còn chuyển trực tiếp từ `h2` xuống `h4`.
- Chuyển tên người đánh giá về văn bản thường và giữ nguyên toàn bộ kiểu trình bày hiện tại.
- Dùng tiêu đề cấp hai cho ba nhóm thông tin độc lập trong footer.

Chỉ cần deploy toàn bộ thư mục V72 lên project Vercel hiện tại. Không cần thay đổi Google Apps Script, Google Sheet, biến môi trường, GA4, Google Ads hoặc Turnstile.

## V71 – vùng chạm form mobile dễ sử dụng hơn

V71 giữ nguyên toàn bộ luồng nhận đăng ký của V70 và tinh chỉnh riêng trải nghiệm trên điện thoại:

- Tăng ba ô `Tỉnh/Thành phố`, `Ngày mong muốn thăm khám` và `Dịch vụ quan tâm` lên tối thiểu 60 px.
- Dùng cỡ chữ 16 px, tăng khoảng cách giữa nhãn và ô nhập, chừa vùng riêng cho mũi tên của ô chọn.
- Rút gọn nội dung mặc định của ô dịch vụ và loại bỏ các chú thích triển khai không còn cần thiết trong mã nguồn.

Chỉ cần deploy toàn bộ thư mục V71 lên project Vercel hiện tại. Không cần thay đổi Google Apps Script, Google Sheet, biến môi trường, GA4, Google Ads hoặc Turnstile.

## V70 – hoàn thiện nội dung và thao tác xem ảnh MRI/CT

V70 tinh chỉnh section chẩn đoán hình ảnh từ V69:

- Tăng kích thước hai dòng tiêu đề và chủ động ngắt đoạn giới thiệu trước “hỗ trợ bác sĩ”.
- Khôi phục ba lợi ích thành ba hàng dọc, giữ nguyên nội dung đã duyệt.
- Viết hoa toàn bộ tên hai hệ thống `FUJIFILM ECHELON SMART 1.5T` và `FUJIFILM SUPRIA 32`.
- Cho phép bấm hoặc chạm vào ảnh phòng MRI/CT để xem ảnh lớn bằng lightbox hiện có.

Chỉ cần deploy toàn bộ thư mục V70 lên project Vercel hiện tại. Không cần thay đổi Google Apps Script, Google Sheet, biến môi trường, GA4, Google Ads hoặc Turnstile.

## V69 – showcase hệ thống chẩn đoán hình ảnh

V69 thiết kế lại toàn bộ section MRI và CT:

- Thay lưới bốn ảnh nhỏ bằng hai showcase card lớn dành riêng cho MRI và CT.
- Đưa ảnh thiết bị công nghệ lên vị trí chủ đạo, giữ ảnh phòng máy thực tế làm lớp minh chứng phụ.
- Bổ sung tên model, nhãn công nghệ và dải ba lợi ích chẩn đoán dễ quét.
- Trên tablet và mobile, hai hệ thống xếp dọc để ảnh giữ được kích thước lớn, không dùng slider hoặc thao tác kéo mới.

Chỉ cần deploy toàn bộ thư mục V69 lên project Vercel hiện tại. Không cần thay đổi Google Apps Script, Google Sheet, biến môi trường, GA4, Google Ads hoặc Turnstile.

## V68 – ảnh sắc nét và tinh chỉnh tương tác mobile

V68 giữ nguyên cơ chế font ổn định của V67, đồng thời:

- Thay 16 ảnh không gian khám bệnh bằng ảnh WebP gốc 1920 × 1280 và gỡ hiệu ứng phóng ảnh gây cảm giác mờ.
- Làm nổi bật cụm niềm tin ở hero, nội dung chuyên môn và số năm kinh nghiệm của từng bác sĩ.
- Khôi phục hiệu ứng thu hút chú ý cho hai CTA chính trên mobile.
- Ngắt dòng thông điệp hero trước “Tầm soát”, khóa hướng kéo slider ảnh và bỏ animation mở câu trả lời FAQ.

Chỉ cần deploy toàn bộ thư mục V68 lên project Vercel hiện tại. Không cần thay đổi Google Apps Script, Google Sheet, biến môi trường, GA4, Google Ads hoặc Turnstile.

## V67 – preload font an toàn ở lần tải đầu

V67 chỉ thay đổi cách trình duyệt tải font ở vùng nhìn đầu tiên:

- Preload đúng các tệp Nunito và Be Vietnam Pro được hero sử dụng trước khi tải CSS.
- Giữ `font-display: swap` để font thương hiệu luôn được áp dụng, kể cả khi mở file HTML trực tiếp hoặc mạng tải chậm.
- Bổ sung chuỗi font dự phòng gần với font chính và đổi phiên bản URL CSS để trình duyệt không giữ bản cũ trong cache.

Khi nâng cấp từ V65 hoặc V66, chỉ cần deploy toàn bộ thư mục V67 lên project Vercel hiện tại. Không cần sửa Apps Script, Google Sheet, biến môi trường, GA4, Google Ads hoặc Turnstile.

## Nâng cấp từ phiên bản đã hoạt động

Nếu landing page của bạn đang nhận được Sheet và email, không cần tạo lại secret hoặc deployment Apps Script:

> Nếu bản v62 với 34 tỉnh/thành và lịch chọn ngày đã chạy trên Vercel, thay đổi hai người nhận chỉ cần cập nhật Apps Script theo bước 2–5 bên dưới; không cần deploy lại frontend. Nếu v62 chưa được đưa lên production, hãy triển khai toàn bộ gói v63 theo đủ các bước.

1. Đẩy toàn bộ mã nguồn mới lên GitHub để Vercel tự triển khai, hoặc chạy `npx vercel@latest --prod`.
2. Khi Vercel báo deployment mới đã sẵn sàng, thay toàn bộ code hiện tại trong Apps Script bằng nội dung mới của `integrations/google-apps-script.gs`.
3. Trong danh sách hàm ở thanh công cụ Apps Script, chọn `prepareLeadSystem` rồi nhấn **Run** một lần. Hàm này chuẩn bị cấu trúc Sheet và bộ đếm trước khi khách gửi form.
4. Chọn **Deploy → Manage deployments → Edit → New version → Deploy**.
5. Gửi một form thử.

Không cần tạo lại `GOOGLE_APPS_SCRIPT_URL`, `LEAD_WEBHOOK_SECRET` hoặc một tab Sheet mới. Đưa website lên trước giúp form cũ không bị Apps Script mới từ chối trong khoảng chuyển phiên bản; lead phát sinh trong vài phút chuyển tiếp vẫn được bản Apps Script cũ lưu, nhưng có thể chưa có hai thông tin bổ sung. Hai trường mới sẽ đi vào đầy đủ sau khi bạn tạo **New version** cho deployment Apps Script hiện tại.

Lần nhận lead đầu tiên sau khi cập nhật, Apps Script sẽ:

- Chèn cột `Mã tham chiếu` vào đầu tab hiện tại.
- Đổi `Mã lead` cũ thành `Mã hệ thống`.
- Tạo mã tham chiếu cho các dòng cũ dựa trên ngày nhận lead.
- Tiếp tục đánh số an toàn cho lead mới mà không xóa hoặc ghi đè dữ liệu.
- Ghi nhớ phiên bản cấu trúc và bộ đếm, tránh quét lại toàn bộ Sheet trong mỗi lượt đăng ký.
- Chèn thêm cột `Tỉnh/Thành phố sinh sống` và `Ngày mong muốn thăm khám` ngay sau cột số điện thoại; dữ liệu cũ được dịch sang phải và giữ nguyên.
- Đưa hai thông tin mới vào cả dòng Google Sheet và email thông báo.

Danh sách trên form gồm đúng 34 tỉnh/thành được công bố từ ngày 12/6/2025: 28 tỉnh và 6 thành phố trực thuộc Trung ương. Mã nguồn kiểm tra lại danh sách này ở cả Vercel Function và Apps Script, nên request tự chèn một địa phương không có trong danh sách sẽ không đi vào Sheet/Gmail. Nguồn đối chiếu: [Chính phủ – Chi tiết 34 đơn vị hành chính cấp tỉnh](https://xaydungchinhsach.chinhphu.vn/chi-tiet-34-don-vi-hanh-chinh-cap-tinh-tu-12-6-2025-119250612141845533.htm).

Trường ngày dùng lịch gốc của trình duyệt/điện thoại và chỉ nhận ngày từ hôm nay đến tối đa 12 tháng tới. Sheet lưu ngày theo dạng `YYYY-MM-DD` để dễ lọc/sắp xếp; email hiển thị dạng `DD/MM/YYYY` để nhân viên dễ đọc.

### Cập nhật hai trường mới vào hệ thống hiện tại

Apps Script gửi cùng một thông báo tới cả `pkdk.hoanglong10@gmail.com` và `cskh@hoanglongclinic.vn`. Bạn không cần đăng nhập hoặc cấp quyền tài khoản `cskh@hoanglongclinic.vn`: email vẫn được gửi bằng tài khoản Google đang triển khai Apps Script, còn địa chỉ CSKH chỉ là người nhận bổ sung. Hai địa chỉ được đặt trong trường `to`; không tạo hai lần ghi Sheet và không dùng `cc`/`bcc`.

Thực hiện đúng thứ tự dưới đây để không làm gián đoạn form đang chạy quảng cáo:

1. Đẩy mã nguồn website bản này lên GitHub/Vercel và chờ deployment báo **Ready**.
2. Trong Apps Script gắn với Sheet hiện tại, thay toàn bộ `Code.gs` bằng file `integrations/google-apps-script.gs` của bản này rồi **Save**.
3. Chọn hàm `prepareLeadSystem` trên thanh công cụ và nhấn **Run** một lần. Nếu Google hỏi quyền, cấp quyền bằng tài khoản hiện đang sở hữu Apps Script và Sheet.
4. Mở tab `Lead Landing Page` và kiểm tra hai cột mới nằm sau `Số điện thoại`. Không tự chèn cột thủ công.
5. Chọn **Deploy → Manage deployments → Edit** deployment Web App đang dùng → chọn **New version** → **Deploy**. Không tạo một deployment mới nếu muốn giữ nguyên URL `/exec` đang khai báo trên Vercel.
6. Gửi một lead thử. Sheet phải có đúng một dòng mới và cả hai hộp thư phải nhận cùng một thông báo.

Hai người nhận được khai báo trong mảng `NOTIFICATION_EMAILS`. Không tạo deployment Apps Script mới; chỉ tạo **New version** cho deployment Web App hiện tại để giữ nguyên URL `/exec`. ID Sheet vẫn lấy từ `SPREADSHEET_ID` hiện tại.

## 1. Thiết lập ban đầu – bỏ qua nếu hệ thống đang nhận Sheet và email bình thường

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
- Honeypot lọc bot tự điền trường ẩn. Ngưỡng 4 giây được tính từ lúc form xuất hiện hoặc người dùng bắt đầu tương tác.
- Ngưỡng 4 giây là **tín hiệu mềm khi Turnstile đang hoạt động**: người dùng autofill nhanh nhưng đã được Turnstile xác minh vẫn được nhận. Nếu Turnstile chưa được cấu hình, submission thiếu thời gian hợp lệ hoặc dưới 4 giây vẫn bị lọc.
- Kết quả Turnstile phải khớp chính xác cả hostname hiện tại và action `lead_form`; token của website hoặc tác vụ khác không được chấp nhận.
- API từ chối POST có `Origin` khác domain hiện tại khi trình duyệt gửi header này.
- Google Apps Script bỏ qua số điện thoại đã được tiếp nhận trong **24 giờ gần nhất** (tối đa 500 lead gần nhất), không tạo thêm dòng Sheet hoặc email trùng.
- `Tỉnh/Thành phố` và `Dịch vụ` được kiểm tra bằng danh sách cho phép; `Ngày mong muốn thăm khám` phải là ngày có thật, không ở quá khứ và không xa hơn 12 tháng. Các quy tắc đều được kiểm tra ở cả Vercel Function và Apps Script.
- Lead trùng hoặc submission bị honeypot loại không phát sự kiện GA4 `generate_lead`, giúp số chuyển đổi sạch hơn.

### Không chặn nhầm bot tìm kiếm hợp lệ

- `robots.txt` cho phép crawl toàn bộ nội dung công khai và chỉ yêu cầu bot không truy cập `/api/`.
- `sitemap.xml`, canonical, `og:url` và thẻ robots trong HTML cùng trỏ tới tên miền chính `https://noisoihoanglong.net/`.
- Không đặt redirect theo hostname trong mã nguồn để tránh can thiệp vào đường dẫn ảnh và `/api/`.
- Trong Vercel → Project → Settings → Domains, đặt `noisoihoanglong.net` phục vụ môi trường **Production**. Với `www.noisoihoanglong.net`, chọn **Redirect to Another Domain** → `noisoihoanglong.net` và dùng chuyển hướng vĩnh viễn. Không đặt bản `www` làm domain chính vì canonical, sitemap, robots, Google Ads và GA4 đều dùng bản không có `www`.
- Sau khi lưu cấu hình, mở riêng `https://noisoihoanglong.net/`, `https://www.noisoihoanglong.net/` và `https://noisoihoanglong.net/api/lead`. Kết quả đúng là URL `www` về domain không `www` trong một lần chuyển hướng, còn ảnh/CSS và `/api/lead` vẫn hoạt động.
- API và cấu hình Vercel không dùng quy tắc kiểu `User-Agent chứa bot/crawler thì chặn`. Googlebot, AdsBot, Bingbot và bot tạo preview vẫn đọc được landing page.
- `/api/` có `X-Robots-Tag: noindex` để công cụ tìm kiếm không đưa endpoint kỹ thuật vào kết quả; điều này không ảnh hưởng trang landing page.

Tên miền `noisoihoanglong.net` phải nằm trong danh sách hostname của Turnstile. Sau mỗi lần deploy, kiểm tra một URL quảng cáo mẫu để bảo đảm `gclid`, `gbraid`, `gad_campaignid` và các tham số UTM vẫn có mặt sau khi chuyển hướng.

### Rate limit ở Vercel Firewall

Tạo rule trong **Vercel project → Firewall → Configure → Add New → Rule**:

1. Tên rule: `Theo dõi spam POST lead`.
2. Điều kiện 1: `Method` bằng `POST`.
3. Điều kiện 2 nối bằng `AND`: `Path` bằng chính xác `/api/lead`.
4. Action: `Rate Limit`; chiến lược `Fixed Window`; counting key `IP`.
5. Thời gian: `600 giây`; ngưỡng ban đầu: `10 request`.
6. Action khi vượt ngưỡng: chọn `Log` trong 24–48 giờ đầu.
7. **Save Rule → Review Changes → Publish**.
8. Nếu log không cho thấy người thật bị chạm ngưỡng, đổi action vượt ngưỡng sang `429` hoặc `Deny`, rồi Publish lại.

Không áp rule này lên `GET /`, ảnh, CSS, JavaScript hoặc `/api/turnstile-config`, và không dùng điều kiện rộng kiểu User-Agent chứa `bot`, `crawler`, `spider` hay `headless`. Không đặt ngưỡng quá thấp vì mạng cơ quan hoặc 4G có thể dùng chung IP. Vercel khuyến nghị thử rule bằng Log trước khi chặn; cấu hình Firewall có hiệu lực mà không cần redeploy website. Tài liệu chính thức: [Vercel WAF Custom Rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules) và [Vercel WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

### Lọc theo quốc gia mà không ảnh hưởng Googlebot

Nếu phòng khám chỉ nhận khách tại Việt Nam, trước tiên hãy tạo một rule **Log** với ba điều kiện `Method = POST`, `Path = /api/lead`, `Country != VN`. Theo dõi vài ngày rồi mới chuyển sang `Deny`. Vì rule chỉ áp dụng cho POST của form nên Googlebot/AdsBot vẫn có thể GET landing page, ảnh, CSS, `robots.txt` và `sitemap.xml` bình thường.

Không nên chặn toàn bộ lượt truy cập ngoài Việt Nam ngay từ đầu: khách đang đi công tác, dùng VPN hoặc mạng định tuyến sai quốc gia cũng có thể bị loại. Nếu domain thực sự được proxy qua Cloudflare (không chỉ cài Turnstile), có thể dùng WAF expression `(http.request.method eq "POST" and http.request.uri.path eq "/api/lead" and ip.src.country ne "VN" and not cf.client.bot)` với **Managed Challenge**. Nếu DNS vẫn đi thẳng vào Vercel, rule Cloudflare WAF sẽ không bảo vệ request; khi đó dùng Vercel Firewall ở trên. Tài liệu chính thức: [Cloudflare country rules](https://developers.cloudflare.com/waf/custom-rules/use-cases/allow-traffic-from-specific-countries/) và [Cloudflare verified bots](https://developers.cloudflare.com/waf/custom-rules/use-cases/allow-traffic-from-verified-bots/).

### Khi nào mới nên thêm OTP

Hãy chạy bản có hai trường mới, Turnstile và rate limit trong khoảng 3–7 ngày rồi so sánh tỷ lệ lead thật/spam. Nếu bot vẫn nhập đúng lựa chọn và dùng số điện thoại có vẻ hợp lệ, lớp tiếp theo mới nên là OTP SMS/Zalo cho các lượt đáng ngờ. OTP cần một nhà cung cấp gửi mã và cơ chế hết hạn/chống thử mã; không nên gửi OTP qua Gmail hoặc bật cho mọi người ngay vì sẽ làm giảm chuyển đổi của người bệnh lớn tuổi.

### Theo dõi quyết định chống spam

Các quyết định được ghi bằng structured log phía server:

| Nhãn log | Ý nghĩa |
| --- | --- |
| `hlc_honeypot_filtered` | Trường bẫy bị điền và request đã bị loại |
| `hlc_timing_filtered` | Request quá nhanh/thiếu thời gian và không có Turnstile bảo chứng |
| `hlc_timing_verified` | Request nhanh nhưng đã vượt Turnstile nên vẫn được nhận |
| `hlc_turnstile_rejected` | Token thiếu, sai, hết hạn hoặc không khớp hostname/action |
| `hlc_origin_rejected` | Trình duyệt gửi request từ một website khác |
| `hlc_form_value_rejected` | Request cố gửi tỉnh/thành phố, ngày khám hoặc dịch vụ không hợp lệ |

Các log này không gửi sang GA4, Google Sheet hoặc Gmail và không thay đổi các sự kiện chuyển đổi hiện có. Mỗi log chỉ có thời điểm, quốc gia/khu vực ước tính, user agent, hostname nguồn/referrer, UTM và lý do quyết định nếu request cung cấp. Hệ thống không ghi tên, số điện thoại, ghi chú, IP đầy đủ, token Turnstile hoặc nội dung bot đã điền vào ô bẫy.

Để xem:

1. Mở Vercel Dashboard và chọn project landing page nội soi.
2. Chọn **Logs** ở thanh bên.
3. Chọn môi trường **Production**, route `/api/lead` và method `POST`.
4. Nhập một trong các nhãn ở bảng trên vào ô tìm kiếm log.
5. Mở từng dòng để xem `decision`, `reason`, `timestamp`, `country`, `region`, `userAgent`, `sourceHost`, `referrerHost` và UTM.

Đặc biệt, so sánh `hlc_timing_filtered` với `hlc_timing_verified`: số thứ hai cho biết những lượt autofill nhanh mà cơ chế cũ có thể đã làm mất nhưng phiên bản này vẫn nhận nhờ Turnstile.

Thời gian trong Runtime Logs hiển thị theo UTC. Vercel hiện lưu Runtime Logs khoảng 1 giờ với Hobby, 1 ngày với Pro và lâu hơn khi dùng Observability Plus. Nếu cần báo cáo theo tuần/tháng, cần kết nối Log Drain hoặc một kho log riêng thay vì gửi bot vào Sheet lead chính.

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
   - `pkdk.hoanglong10@gmail.com` và `cskh@hoanglongclinic.vn` cùng nhận được email thông báo.
   - Hai cột `Tỉnh/Thành phố sinh sống` và `Ngày mong muốn thăm khám` có đúng lựa chọn vừa thử.
   - Email có hai dòng thông tin tương ứng để nhân viên ưu tiên gọi lại.
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
- Có honeypot, tín hiệu thời gian kết hợp Turnstile và khóa nút trong lúc gửi để giảm spam/gửi trùng mà hạn chế mất lead autofill.
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
- Nunito và Be Vietnam Pro được phục vụ trực tiếp từ `assets/fonts/` với đường dẫn tương đối đúng từ file CSS và `font-display: swap`, đảm bảo font thương hiệu được hiển thị ổn định thay vì giữ font fallback ở lần tải đầu.
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

Chế độ debug chỉ được bật trên thiết bị có tham số `ga_debug=1`; trang production thông thường không ghi log debug. Các sự kiện GA4 không chứa họ tên, số điện thoại, tỉnh/thành phố, ngày mong muốn, ghi chú hay dịch vụ người dùng đã chọn. Hai trường mới chỉ đi vào backend, Sheet và Gmail; tên sự kiện cùng cách tính `generate_lead` hiện tại không đổi.

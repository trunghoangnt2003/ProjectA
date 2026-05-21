# ROADMAP — Quản lý Sân Cầu Lông

Lộ trình đưa FE từ hiện trạng → bản đặc tả đầy đủ. Build **theo phase**, mỗi phase được duyệt
trước khi bắt đầu. Tất cả vẫn là **FE mock** (xem [FRONTEND_GUIDELINES.md](FRONTEND_GUIDELINES.md)):
mỗi module có service riêng, UI không đổi khi nối API thật.

Có **2 track** trong **cùng app `frontend/`** (3 persona toàn dự án: + `frontend-booking/` cho khách):

- **Track A — Admin / Quản lý** (back-office): 11 module quản trị. Layout `AppLayout` hiện tại.
- **Track B — POS / Nhân viên trực quầy**: 14 module vận hành quầy. **Gộp vào admin dưới `/pos/*`**
  với **layout touchscreen riêng**, **dùng chung** `types/domain.ts`, `services/`, RBAC. POS là một
  "chế độ" của cùng app, không phải app riêng → tránh trùng domain.

**Thứ tự:** làm **Track A trước** (đang ở P1), Track B sau (nhiều phần phụ thuộc nền tảng của Track A).

**Chú thích:** ✅ đã có · ⚠️ một phần · ❌ chưa có

---

## Hiện trạng vs Đích

| # | Module | Hiện trạng | Phase |
| - | ------ | ---------- | ----- |
| 1 | Dashboard / Analytics | ⚠️ Overview cơ bản | **P1** |
| 11 | Reports & Analytics | ❌ | **P1** |
| 2 | Booking Management | ⚠️ CRUD + lịch + filter | P2 |
| 5 | Payment Management | ❌ | P3 |
| 4 | Customer CRM | ⚠️ List + tier | P4 |
| 6 | Service Management | ✅ Hàng hóa + Vật tư + POS | P5 |
| 8 | Promotion | ❌ | P6 |
| 9 | Membership | ❌ (chỉ field tier) | P6 |
| 7 | Employee Management | ⚠️ CRUD + ca | P7 |
| 10 | Notification | ❌ | P8 |
| 3 | Court Management | ✅ CRUD + giá giờ | P9 |

> **Phụ thuộc dữ liệu:** Analytics (P1) chính xác hơn khi P2 (status booking) và P3 (payment)
> hoàn tất. P1 dùng mock seed được làm giàu trước; các phase sau nâng độ thật của số liệu.

---

## Quy ước chung mỗi phase

Mỗi module mới phải:
1. **Service mock** trong `services/` (chữ ký `list/create/update/remove` hoặc hàm đọc riêng).
2. **Type** trong `types/domain.ts`.
3. **Section/Page** trong `components/<module>/`, dùng common components.
4. **Nav + route + permission**: thêm vào `config/navigation.tsx` (`permission`), map `PAGES` trong
   `DashboardPage.tsx` (lazy), thêm quyền vào `constants/permissionOptions.ts` + `PERMISSION_LABELS`
   + gán cho role trong `services/mock/adminMock.ts`.
5. **Build pass** (`npm run build`) + responsive + 3 trạng thái loading/empty/error.

---

# Track A — Admin / Quản lý

## Phase 1 — Dashboard & Reports/Analytics ⭐ (ưu tiên)

**Mục tiêu:** trang Tổng quan đủ chỉ số vận hành + trang Reports với biểu đồ.

### Scope
- **Overview** bổ sung: số sân đang hoạt động, số sân trống, **khách đang chơi**, **tỉ lệ lấp đầy sân** (theo slot hôm nay).
- **Analytics/Reports** (nav mới `reports`, quyền `report.view`):
  - Revenue chart (doanh thu theo ngày — sân + bán hàng).
  - Peak hours (mật độ booking theo khung giờ).
  - Booking trends (số booking theo ngày, tỉ lệ hủy/no-show).
  - Top customers (chi tiêu nhiều nhất).
  - Court performance (doanh thu / lượt đặt theo sân).

### Kỹ thuật
- **Thêm dependency:** `@mantine/charts` + `recharts` (đúng hệ Mantine, không lệ thuộc CSS rời).
- Mock: `analyticsService` tổng hợp từ `bookingService` + `orderService` + `courtService`; hàm
  `occupancyRate(date)`, `revenueByDay(range)`, `peakHours(date)`, `topCustomers()`, `courtPerformance()`.
- Làm giàu mock booking seed (nhiều ngày) để biểu đồ có dữ liệu.

### Done khi
Overview hiện đủ 6 chỉ số; trang Reports có ≥4 biểu đồ + chọn khoảng ngày; build pass.

---

## Phase 2 — Booking nâng cao ✅

**Đã làm:**
- Status mở rộng: thêm `playing`, `no-show` (tổng 6 trạng thái) — meta dùng chung `bookingStatus.ts`.
- Workflow: Xác nhận → Check-in (playing) → Check-out (completed); đánh dấu không đến; hủy **có lý do**.
- Đổi sân / đổi giờ qua modal sửa (Select sân + input giờ).
- Tạo nâng cao: chọn **nhiều sân** + **đặt định kỳ hàng tuần** (N tuần) → sinh nhiều lượt.
- Đồng bộ status mới sang Lịch sân, Lịch hôm nay, Tổng quan; analytics tính `playing` vào doanh thu/đang chơi.

**Hoãn sang phase tích hợp BE** (cần realtime/dữ liệu server, không phù hợp mock thuần):
waitlist queue, booking lock realtime.

---

## Phase 3 — Payment Management ✅

Nav `payments`, quyền `payment.view` / `payment.manage`.
- Theo dõi khoản thu gắn booking + order; status `pending/paid/failed/refunded`; methods Cash/QR/Ví/Card.
- Hành động: **xác nhận đã thu** (CK), **hoàn tiền có lý do**, đánh dấu thất bại.
- **Thu tiền** cho lượt đặt (chọn booking → auto số tiền → method/status).
- **Hóa đơn** (modal + nút In), filter (trạng thái/phương thức/ngày/tìm kiếm), 3 thẻ thống kê (thực thu hôm nay / chờ thu / đã hoàn).

**Quyết định doanh thu:** Reports/Overview giữ **doanh thu ghi nhận** (booked, từ booking+order);
Payment hiển thị **thực thu** (collected, `paidRevenueOn`). Hợp nhất hai nguồn về một (payment `paid`)
sẽ làm khi BE là nguồn chân lý — tránh lệch số trên dữ liệu mock.

---

## Phase 4 — Customer CRM ✅

- Hồ sơ khách (Drawer): thông tin + **lịch sử đặt sân** (khớp theo SĐT) + điểm tích lũy + **công nợ** + ghi chú nội bộ.
- Tags: VIP / Khách quen / Công nợ xấu / Khách mới (thay `tier` cũ); lọc theo tag + tìm kiếm.
- Actions (mock): gửi voucher, gửi thông báo, khóa/mở tài khoản, reset mật khẩu, **cộng điểm**, **thu nợ** (debt→0 + gỡ tag công nợ xấu).
- CRUD form mở rộng: tags, điểm, công nợ, ghi chú, khóa.

---

## Phase 5 — Service Management (nâng cấp) ✅

- **Combo dịch vụ** (`combos`): CRUD gói nhiều mặt hàng + giá ưu đãi (gợi ý −10%), bật/tắt bán POS.
  Tích hợp vào **Bán hàng**: combo lên catalog, tồn = số bộ lắp được từ thành phần; thanh toán **trừ tồn từng thành phần**.
- **Nhập / Xuất kho** (`inventory`): giao dịch có lưu vết (`StockMovement`) — cập nhật tồn Hàng hóa/Vật tư + lịch sử + lý do.
- **Thuê đồ** (`rentals`): cho thuê vợt/giày (vật tư sân nhóm Vợt/Giày), đặt cọc, mượn → **trừ tồn**, nhận trả → **hoàn tồn** + hoàn cọc.

Quyền: `combo.manage`, `inventory.manage`, `rental.manage`.

---

## Phase 6 — Promotion + Membership ✅

- **Khuyến mãi** (`promotions`): CRUD voucher/mã giảm; loại Giảm %/Giảm tiền/Tặng dịch vụ/Hoàn tiền;
  hiệu lực theo ngày + khung giờ (happy hours); đơn tối thiểu, giới hạn lượt, bật/tắt; 3 thẻ thống kê.
- **Thành viên** (`memberships`): CRUD gói theo cấp Basic/Silver/Gold/Platinum (dạng thẻ) — giá, hạn dùng (ngày),
  % giảm, danh sách quyền lợi, bật/tắt bán.
- Quyền: `promotion.manage`, `membership.manage`; nhóm nav mới "Khuyến mãi & Thành viên".

> Áp voucher khi bán (POS) & gán gói cho khách (expiration theo khách) → để ở **POS-B2** / tích hợp CRM sau.

---

## Phase 7 — Employee Management (nâng cấp) ✅

- **Phân ca** (`roster`): lưới tuần (nhân viên × 7 ngày), bấm ô gán/đổi/bỏ ca; chuyển tuần.
- **Chấm công** (`attendance`): theo ngày — có mặt/đi muộn/vắng + giờ vào/ra; thêm & đổi trạng thái.
- **Bảng lương & KPI** (`payroll`): theo tháng — ca công × lương/ca = tổng lương; KPI đúng giờ %, vắng; quỹ lương.
- Employee +`shiftRate`; nhóm nav mới "Nhân sự" (gom Nhân viên + 3 màn trên). Quyền `roster.manage`/`attendance.manage`/`payroll.view`.

---

## Phase 8 — Notification Management ✅

- **Lịch sử gửi**: log thông báo (kênh Email/SMS/Push/Zalo OA, đối tượng, người nhận, trạng thái) + thống kê + lọc kênh.
- **Gửi thông báo**: soạn & gửi ngay / lên lịch (mock).
- **Tự động hóa**: 4 quy tắc — nhắc booking, nhắc thanh toán, campaign khuyến mãi, sinh nhật — bật/tắt + đổi kênh.
- Quyền `notification.manage`; nav trong nhóm "Khuyến mãi & Thành viên".

---

## Phase 9 — Court Management (nâng cấp) ✅

- **Loại sân** (Thường/VIP/Thi đấu) + badge; **ảnh sân** (URL mock, thumbnail bảng + preview form).
- Giá nâng cao: **giờ cao điểm** (qua bảng giá khung giờ sẵn có) + **phụ thu cuối tuần / ngày lễ (%)** + **giảm cho thành viên (%)**.

---

# Track B — POS / Nhân viên trực quầy

Gộp vào app admin dưới **`/pos/*`** với **layout touchscreen riêng** (`PosLayout`: thanh tác vụ nhanh,
nút lớn, ít cấp menu). **Dùng chung** type/service/RBAC với Track A. Truy cập theo quyền `pos.*`.

### Hiện trạng vs Đích (14 module POS)

| # | Module POS | Hiện trạng | POS-Phase |
| - | ---------- | ---------- | --------- |
| 2 | POS Bán hàng | ✅ `SaleSection` (giỏ, trừ kho, thanh toán) | nâng cấp ở B2 |
| 7 | Inventory Mini POS | ✅ trừ kho tự động + cảnh báo | B1 (tái dùng) |
| 12 | Staff Permissions | ✅ RBAC (thêm role Cashier/Supervisor/Receptionist) | B1 |
| 8 | Customer Lookup | ⚠️ phụ thuộc CRM (A-P4) | B3 |
| 4 | Check-in / Check-out | ❌ (chung với A-P2) | B2 |
| 6 | Order Management (gọi món tại sân) | ❌ | B4 |
| 1 | POS Dashboard (theo ca) | ❌ | B1 |
| 3 | Booking POS (đặt nhanh tại quầy) | ❌ | B1 |
| 5 | Court Live Status (realtime) | ❌ | B1 |
| 9 | Cashier Management (mở/đóng ca) | ❌ | B3 |
| 10 | Staff Task Management | ❌ | B4 |
| 11 | Staff Notifications | ❌ | B4 |
| 13 | POS Hardware Support | ❌ (stub) | B5 |
| 14 | Fast Actions UI | ❌ (touchscreen) | xuyên suốt + B5 |

> **Phụ thuộc Track A:** Check-in/out cần status booking (A-P2); thanh toán/refund POS cần Payment (A-P3);
> Customer Lookup cần CRM (A-P4). Vì vậy Track B chạy sau khi A-P2/P3 xong; phần độc lập (shell, dashboard
> ca, court live, quick booking) có thể làm sớm ở B1.

### POS-Phase B1 — Khung POS + vận hành cơ bản ✅
- `PosLayout` (touchscreen, header tối + nút lớn) + route `/pos/*` (chọn theo URL trong `App`) + nút "Mở POS"/"Thoát POS".
- Quyền `pos.use`/`pos.cashier`; gán Admin/QuanLy/LeTan/PhucVu + role mẫu `ThuNgan`.
- **PosDashboard**: sân đang chơi, khách check-in, booking sắp tới, đơn POS, doanh thu + Quick Actions + cảnh báo.
- **CourtLive**: bảng trạng thái (trống/đang chơi/sắp hết giờ/bảo trì) + gia hạn +30'/kết thúc.
- **QuickBooking**: đặt nhanh walk-in, gợi ý sân trống, tự tính giá, 1-click.

### POS-Phase B2 — Check-in/out + Bán hàng ✅ (một phần)
- **CheckInOut**: lọc chờ vào sân/đang chơi, check-in (→playing) / check-out (→completed).
- **Bán hàng**: tái dùng `SaleSection` (giỏ, trừ kho, combo). *Discount/voucher/split bill/print: hoãn (cần model hóa đơn POS riêng).*

### POS-Phase B3 — Cashier shift + Customer lookup ✅
- **CashierShiftScreen**: mở ca (tiền đầu ca) → doanh thu trong ca → đóng ca kiểm kê tiền (lệch thừa/thiếu) + lịch sử ca.
- **CustomerLookup**: tìm nhanh theo tên/SĐT, hiện tags/điểm/công nợ/lượt đặt/gần nhất + gọi.

### POS-Phase B4 — Task + cảnh báo ✅
- **StaffTasks**: bảng 3 cột (chờ/đang làm/xong), thêm việc + chuyển tiến độ + xóa.
- **Staff notifications**: gộp vào PosDashboard (cảnh báo sắp tới giờ + hàng sắp hết). *Order gọi món tại sân (merge/split): hoãn.*

### POS-Phase B5 — Hardware + Fast Actions ✅
- **DeviceSettings**: mô phỏng máy in hóa đơn / quét mã / ngăn kéo tiền / QR / in bếp (kết nối + kiểm tra).
- Fast Actions: PosLayout touchscreen + nút lớn ở Dashboard; *drag & drop booking: hoãn.*

---

## Tiến độ

**Track A — Admin**
- [x] **A-P1** Dashboard & Reports/Analytics ✅
- [x] **A-P2** Booking nâng cao ✅ (waitlist/realtime hoãn sang BE)
- [x] **A-P3** Payment ✅
- [x] **A-P4** Customer CRM ✅
- [x] **A-P5** Service nâng cấp ✅
- [x] **A-P6** Promotion + Membership ✅
- [x] **A-P7** Employee nâng cấp ✅
- [x] **A-P8** Notification ✅
- [x] **A-P9** Court nâng cấp ✅ — **Track A hoàn tất** 🎉

**Track B — POS / Nhân viên** (gộp `/pos/*`, touchscreen)
- [x] **B1** Khung POS + Dashboard ca + Court Live + Booking POS ✅
- [x] **B2** Check-in/out + Bán hàng ✅ (voucher/split bill hoãn)
- [x] **B3** Cashier shift + Customer lookup ✅
- [x] **B4** Task + cảnh báo ✅ (order gọi món hoãn)
- [x] **B5** Hardware (mô phỏng) + Fast Actions ✅ — **Track B hoàn tất** 🎉

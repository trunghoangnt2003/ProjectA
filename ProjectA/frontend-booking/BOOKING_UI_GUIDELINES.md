# BOOKING UI GUIDELINES — Sân Cầu Lông (customer-facing)

Quy tắc thiết kế giao diện cho web đặt sân. **Mọi update UI về sau PHẢI tuân theo file này.**
Mục tiêu phong cách: **hiện đại · năng động · trẻ trung · thể thao · hút khách**.

> Đọc trước khi sửa giao diện. Dùng làm checklist khi review.

---

## 1. Tinh thần thương hiệu

- Năng lượng thể thao: màu tươi, tương phản mạnh, bo góc lớn, chuyển động nhẹ.
- Rõ ràng, dứt khoát: CTA nổi bật, ít chữ, nhiều khoảng thở.
- Mobile-first: khách đặt sân chủ yếu trên điện thoại.

---

## 2. Màu sắc — chỉ dùng token trong [`src/theme/theme.ts`](src/theme/theme.ts)

| Vai trò | Token | Dùng cho |
| --- | --- | --- |
| Primary | `brand` (emerald dịu, idx 6 = `#1f9d6b`) | thương hiệu, link, trạng thái tích cực, nút chính |
| Accent | `accent` (coral ấm, idx 6 = `#d4542f`) | **CTA quan trọng** (Đặt sân, Tiếp theo), điểm nhấn, giá tiền |
| Nền | `gray.0` | nền trang |
| Trắng | white | card, ô trống trên lưới |
| Lỗi/Đã đặt | `red.4` | ô đã đặt, thông báo lỗi |

Quy tắc:
- **KHÔNG hardcode** mã hex/px rời rạc trong component — lấy từ theme (`color="accent"`, `var(--mantine-color-brand-6)`, token spacing).
- Mỗi màn chỉ **1 CTA accent** chính. Lạm dụng cam → mất tác dụng.
- Gradient dùng từ `theme.other.gradients` (`hero`, `accent`); chữ gradient dùng class `.gradient-text`.

---

## 3. Typography

- Font: **Poppins** (nạp ở `index.html`), fallback Inter/system.
- Heading **fw 700–800**, bo gọn (`lh` 1.0–1.1 cho tiêu đề lớn).
- Hero title: 36–52px, `fw={800}`. Section title: `Title order={2}`.
- Body: 14–16px. Chú thích: `c="dimmed"`, size xs/sm.
- Tiếng Việt cho nội dung; tiếng Anh cho code.

---

## 4. Hình khối & độ sâu

- **Bo góc lớn**: `defaultRadius = "lg"`. Nút = **pill** (`radius="xl"`). Badge = `sm`.
- Card: `radius="lg"`, `shadow="sm"`, có `withBorder` khi trên nền trắng.
- Bóng đổ dùng token (`xs/sm/md/lg`) — đã pha tông xanh thương hiệu, KHÔNG tự viết `box-shadow`.
- Spacing theo thang Mantine (`xs…xl`), nhịp section dọc rộng (`py={48}`–`64`).

---

## 5. Chuyển động (motion)

- Tinh tế, nhanh (120–180ms), không gây giật.
- Card tương tác: thêm class **`.hover-lift`** (nâng + đổ bóng) — định nghĩa ở [`src/styles/global.css`](src/styles/global.css).
- Tránh animation lòe loẹt, auto-play nặng.
- **Loader**: luôn dùng [`AppLoader`](src/components/AppLoader.tsx) (vòng gradient xoay + đốm tâm). KHÔNG dùng `Loader` mặc định rời rạc. Với `LoadingOverlay` truyền `loaderProps={{ children: <AppLoader label="..." /> }}`.

> **Tông màu phải ÔN HÒA** — emerald dịu + coral ấm. Không dùng xanh/cam neon chói. Mọi gradient/nền lấy độ bão hòa vừa phải.

---

## 6. Thành phần & mẫu dùng lại

- **Hero**: nền gradient `brand` + lớp radial sáng, chữ trắng, 1 CTA `accent` + 1 nút phụ trắng, hàng **stat chips** (kính mờ).
- **Feature card**: `ThemeIcon` (variant light) + tiêu đề đậm + mô tả dimmed, `.hover-lift`.
- **CTA band**: dải nền `accent`, chữ trắng, nút trắng — đặt cuối trang.
- **Nút**: chính = `color="accent"` (đặt sân); phụ/điều hướng = `brand` light/subtle; xác nhận an toàn = `brand`.
- **Giá tiền**: luôn `c="accent.6"`, `fw 800`.
- **Map**: dùng [`VenueMap`](src/components/VenueMap.tsx) (nhúng Google Maps + chỉ đường), không tự nhúng iframe rời.

---

## 7. Lưới đặt sân ([`BookingGrid`](src/components/BookingGrid.tsx))

- Bố cục **nằm ngang**: hàng = sân, cột = khung 30 phút; header giờ + cột tên sân **sticky**.
- Trạng thái ô — màu cố định:
  - Trống = `white`, hover con trỏ pointer.
  - Đang chọn = `brand.5`.
  - Đã đặt = `red.4`, `cursor: not-allowed`, không cho chọn.
- **Chọn bằng click từng ô** (toggle), KHÔNG bắt buộc kéo. Giữ chú thích màu (legend) luôn hiển thị.
- Tổng tiền/CTA trong [`BookingSummary`](src/components/BookingSummary.tsx): giá `accent`, nút "Tiếp theo" `color="accent"`.

---

## 8. Trạng thái & phản hồi

- Loading: `LoadingOverlay` / `Loader`.
- Rỗng: câu hướng dẫn ngắn, thân thiện (vd "Bấm vào ô trống để chọn...").
- Thành công/lỗi: toast qua [`src/lib/notify.ts`](src/lib/notify.ts) (`success` teal, `error` red).
- Nút async phải có `loading`.

### Trạng thái lượt đặt (tra cứu) — màu cố định

Suy ra bằng [`getPlayStatus`](src/lib/bookingStatus.ts) từ thời gian thực; KHÔNG tự map lại nơi khác:

| Trạng thái | Khi nào | Màu |
| --- | --- | --- |
| Chờ xác nhận | `status = "pending"` (mới đặt) | `yellow` |
| Sắp tới giờ | đã xác nhận, chưa tới giờ bắt đầu | `blue` |
| Đang giờ chơi | đã xác nhận, đang trong khung giờ | `brand` |
| Đã chơi xong | đã xác nhận, đã qua giờ kết thúc | `gray` |

Đặt sân xong PHẢI hiện **mã đặt sân** để khách lưu (modal kết quả + nút sao chép). Trang Tra cứu
nhận **mã hoặc số điện thoại**.

---

## 9. Responsive & a11y

- `SimpleGrid`/`Grid` với `cols={{ base, sm, md }}`; ưu tiên 1 cột trên mobile.
- Vùng bấm tối thiểu ~32px; nút icon-only phải có `title`/aria-label.
- Tương phản chữ/nền đạt chuẩn; chữ trên gradient luôn trắng + đủ đậm.

---

## 10. Checklist trước khi merge UI

- [ ] Chỉ dùng token theme (màu/spacing/radius/shadow), không hardcode.
- [ ] Đúng tinh thần: tươi, năng động, bo lớn, 1 CTA accent/màn.
- [ ] Giá tiền màu `accent.6` đậm; CTA chính màu accent.
- [ ] Card tương tác có `.hover-lift`.
- [ ] Trạng thái loading/empty/error đầy đủ; toast qua `notify`.
- [ ] Lưới giữ đúng màu trạng thái + chọn bằng click.
- [ ] Responsive mobile; build `npm run build` pass.

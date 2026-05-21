# FRONTEND GUIDELINES — Hệ thống quản lý Sân Cầu Lông

Tài liệu quy định **cách thiết kế và xây dựng giao diện** cho FE. Mọi màn hình/feature mới
PHẢI tuân theo các quy tắc dưới đây để giao diện nhất quán, dễ bảo trì và mở rộng.

> Đọc file này trước khi tạo màn hình mới. Khi review PR, dùng nó làm checklist.

---

## 1. Domain & phạm vi

Sản phẩm là web quản lý **sân cầu lông**. Các module nghiệp vụ:

Tất cả module hiện chạy bằng **MOCK DATA** (FE làm trước, BE làm sau). Mỗi module có
service riêng — khi có API thật chỉ cần thay thân service, UI không đổi.

| Module        | Key (nav)   | Service (mock)              |
| ------------- | ----------- | --------------------------- |
| Tổng quan     | `overview`  | tổng hợp từ các service     |
| Sân cầu       | `courts`    | `courtService`              |
| Đặt sân       | `bookings`  | `bookingService`            |
| Lịch hôm nay  | `schedule`  | `bookingService` + `courtService` (chỉ-xem) |
| Khách hàng    | `customers` | `customerService`           |
| Bán hàng (POS)| `sales`     | `productService` + `supplyService` (forSale) + `orderService` |
| Lịch sử bán hàng | `orders` | `orderService`              |
| Hàng hóa      | `products`  | `productService`            |
| Vật tư        | `supplies`  | `supplyService`             |
| Người dùng    | `users`     | `mock/adminMock`            |
| Phân quyền    | `roles`     | `mock/adminMock`            |
| Nhân viên     | `employees` | `employeeService`           |

> **Kho & bán hàng:** "Hàng hóa" (đồ uống/đồ ăn) và "Vật tư bán" (cầu/cước, `forSale=true` + `salePrice`)
> là nguồn hàng cho màn **Bán hàng**. "Vật tư sân" (`forSale=false`) phục vụ sân, không lên POS.
> Thanh toán → trừ tồn kho nguồn + tạo `Order` (tính vào doanh thu, xem ở **Lịch sử bán hàng**).

### Phân quyền menu & màn hình (RBAC FE)

- Mỗi module khai báo `permission` trong [`config/navigation.tsx`](src/config/navigation.tsx) (bỏ trống = ai cũng vào).
- Quyền hiệu lực của user = role permissions + `directPermissions`, tính ở `getEffectivePermissions` (mock),
  lưu localStorage và cấp qua [`hooks/usePermissions.tsx`](src/hooks/usePermissions.tsx) (`can(permission)`).
- `DashboardPage` lọc menu theo `can()` và chặn màn hình bằng `MODULE_PERMISSION` (kèm màn "Không có quyền").
- Danh mục quyền: [`constants/permissionOptions.ts`](src/constants/permissionOptions.ts) — đồng bộ khi BE có `PermissionConstants` thật.

Ngôn ngữ giao diện: **Tiếng Việt**. Tên biến/hàm/file: **tiếng Anh**.

### Ca làm việc & RBAC (nghiệp vụ quan trọng)

Nhân viên gắn với 1 trong **3 ca** (xem [`src/constants/shifts.ts`](src/constants/shifts.ts)):
`S1` 08:00–17:00, `S2` 17:00–24:00, `S3` 00:00–08:00.

Rule backend (RBAC): nhân viên **chỉ thực hiện được action trong khung giờ ca của mình**.
Đây là rule giờ-hành-chính cũ, **không đổi logic kiểm tra** — chỉ đổi NGUỒN khung giờ từ
giờ cố định (BusinessHours) sang ca làm việc gắn với nhân viên. FE chọn ca qua `SHIFT_OPTIONS`.

---

## 2. Stack & nền tảng

- **React 18 + TypeScript + Vite**
- **Mantine 7** (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`) — thư viện UI chính.
- **@tabler/icons-react** — bộ icon DUY NHẤT. Không trộn icon set khác.
- Styling qua **theme + props của Mantine**, không viết CSS rời rạc.

> ✅ **Bootstrap đã được gỡ bỏ hoàn toàn.** Toàn bộ UI dùng Mantine. KHÔNG thêm lại Bootstrap
> hay bất kỳ CSS framework nào khác.

### Tầng MOCK DATA (đang dùng — BE chưa có)

- [`src/services/mock/mockClient.ts`](src/services/mock/mockClient.ts): `createMockService(seed)`
  tạo CRUD trên mảng in-memory + `mockDelay` giả lập độ trễ.
- [`src/hooks/useCrudResource.ts`](src/hooks/useCrudResource.ts): hook CRUD dùng chung
  (auto load + create/update/remove + toast + reload).
- **Khi có API thật:** giữ nguyên chữ ký `list/create/update/remove`, thay thân hàm bằng
  gọi `api()` (xem `services/api.ts`). Section KHÔNG phải sửa.
- Service thật cũ vẫn còn trong repo (`adminService.ts`, `authService.ts`) để tham chiếu/khôi phục.

---

## 3. Design tokens — nguồn chân lý duy nhất

Tất cả định nghĩa trong [`src/theme/theme.ts`](src/theme/theme.ts). **Không hardcode** màu hex,
px, font rời rạc trong component.

- **Màu chính**: `brand` (xanh dương, index 6). Dùng `color="brand"` hoặc
  `var(--mantine-color-brand-6)`.
- **Màu trạng thái**: `teal` = thành công, `red` = lỗi/xóa, `orange` = cảnh báo, `gray` = phụ.
- **Spacing**: chỉ dùng token `xs/sm/md/lg/xl` (base 8px). Vd `mt="md"`, `gap="lg"`. KHÔNG `style={{ marginTop: 17 }}`.
- **Radius**: mặc định `md`. Card/Button/Input đã set sẵn radius trong theme.
- **Bóng đổ**: `shadow="xs|sm|md"`, không tự viết `box-shadow`.

Khi cần token mới (màu, spacing): thêm vào `theme.ts`, KHÔNG đặt giá trị rời trong component.

---

## 4. Cấu trúc thư mục

```
src/
  theme/theme.ts            # design tokens
  config/navigation.tsx     # cấu trúc sidebar theo domain
  lib/notify.ts             # toast + helper lỗi dùng chung
  components/
    layout/AppLayout.tsx    # khung Sidebar + Topbar (AppShell)
    common/                 # component tái sử dụng (export qua index.ts)
    <module>/<Module>Section.tsx   # UI từng nghiệp vụ
  pages/                    # màn hình ghép (LoginPage, DashboardPage, OverviewPage)
  services/                 # gọi API (fetch wrapper trong api.ts)
  types/index.ts            # kiểu dữ liệu chung
```

Quy tắc:
- Component dùng lại ≥ 2 nơi → đưa vào `components/common/` và export trong `index.ts`.
- UI riêng của một nghiệp vụ → `components/<module>/`.
- Logic gọi API → `services/`, KHÔNG fetch trực tiếp trong component.

---

## 5. Common components (bắt buộc dùng)

Import từ barrel: `import { PageHeader, DataTable, StatCard, ConfirmDeleteButton, EmptyState, ErrorAlert } from "../common";`

| Component             | Dùng khi                          | Ghi chú |
| --------------------- | --------------------------------- | ------- |
| `AppLayout`           | Khung mọi trang sau đăng nhập     | Nhận `navGroups`, `activeKey`, `onNavigate` |
| `PageHeader`          | Tiêu đề đầu mỗi trang             | `title` + `subtitle` + `actions` (nút phải) |
| `StatCard`            | Thẻ chỉ số ở dashboard            | `label`, `value`, `icon`, `color` |
| `DataTable<T>`        | Mọi danh sách dạng bảng           | Có sẵn loading + empty state |
| `ConfirmDeleteButton` | Mọi hành động xóa                 | Luôn xác nhận trước khi xóa |
| `EmptyState`          | Danh sách rỗng / chưa có dữ liệu  | |
| `ErrorAlert`          | Lỗi inline trong form/trang       | |
| `notify` (lib)        | Phản hồi sau hành động (toast)    | `notify.success/error/info` |

**KHÔNG** tự dựng lại bảng/nút xóa/empty state thủ công — dùng common. Nếu common thiếu tính
năng, mở rộng chính nó (không fork).

### Mẫu một module CRUD mới

```tsx
import { PageHeader, DataTable, ConfirmDeleteButton } from "../common";
import type { DataTableColumn } from "../common";
import { notify, toMessage } from "../../lib/notify";

const columns: DataTableColumn<Court>[] = [
  { key: "name", header: "Tên sân", render: (c) => c.name },
  { key: "status", header: "Trạng thái", render: (c) => <Badge>{c.status}</Badge> },
  {
    key: "actions", header: "", align: "right",
    render: (c) => <ConfirmDeleteButton itemLabel={c.name} onConfirm={() => handleDelete(c.id)} />,
  },
];

return (
  <>
    <PageHeader title="Sân cầu" subtitle="Quản lý danh sách sân"
      actions={<Button leftSection={<IconPlus size={16} />} onClick={openCreate}>Thêm sân</Button>} />
    <DataTable data={courts} columns={columns} rowKey={(c) => c.id}
      loading={loading} emptyTitle="Chưa có sân nào" />
  </>
);
```

---

## 6. Layout & navigation

- Khung do `AppLayout` lo: Sidebar trái (260px, thu gọn ở mobile qua Burger) + Topbar 64px
  (tiêu đề + menu user/đăng xuất).
- Thêm module: khai báo trong [`src/config/navigation.tsx`](src/config/navigation.tsx)
  (`NAV_GROUPS` + `NAV_TITLES` + `permission`), đặt `disabled: true` khi chưa có API → tự hiện nhãn "Sắp có".
- **Điều hướng dùng `react-router` (URL theo module):** mỗi page có path `/<key>` (vd `/courts`, `/sales`).
  `DashboardPage` suy ra module đang mở từ URL, render `<Routes>` và **lazy-load** từng page (`React.lazy` +
  `Suspense`) để chia nhỏ bundle. Thêm module = thêm 1 dòng vào map `PAGES` trong `DashboardPage.tsx`.
- `BrowserRouter` đặt ở [`main.tsx`](src/main.tsx). Khi deploy static, cần cấu hình **SPA fallback**
  (mọi route → `index.html`) để refresh sâu không bị 404; `vite dev`/`vite preview` đã tự lo.

---

## 7. Form & validation

- Input dùng component Mantine (`TextInput`, `PasswordInput`, `Select`, `NumberInput`...).
- Form phức tạp: dùng `@mantine/form` (`useForm`) thay vì nhiều `useState` rời.
- Nút submit phải có trạng thái `loading` trong khi gọi API.
- Lỗi từ field → hiện dưới input; lỗi chung → `ErrorAlert` đầu form hoặc `notify.error`.

---

## 8. Gọi API & xử lý lỗi

- Mọi request qua wrapper [`src/services/api.ts`](src/services/api.ts) (tự gắn `Authorization`, parse lỗi).
- Mỗi module có file service riêng trong `services/`.
- Sau hành động: **thành công** → `notify.success`; **lỗi** → `notify.error(toMessage(err))`.
- 401 → wrapper tự xóa token; UI quay về màn đăng nhập.

---

## 9. Trạng thái UI bắt buộc

Mọi danh sách/trang dữ liệu phải xử lý đủ 3 trạng thái:
1. **Loading** — `DataTable` có sẵn spinner; hoặc dùng `Skeleton`.
2. **Empty** — `EmptyState` / prop `emptyTitle` của `DataTable`.
3. **Error** — `ErrorAlert` hoặc `notify.error`.

---

## 10. Responsive & accessibility

- Mobile-first: dùng `SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}`, props `visibleFrom`/`hiddenFrom`.
- Mọi nút icon-only phải có `Tooltip`/`aria-label`.
- Đủ tương phản màu chữ/nền (ưu tiên token theme đã chỉnh).
- Không đặt kích thước cố định gây vỡ ở màn nhỏ.

---

## 11. Quy ước code

- TypeScript **strict**, không `any`. Kiểu chung khai báo ở `types/`.
- Component: named export, PascalCase. Một component / file.
- Props khai báo qua `interface`, mô tả ngắn cho prop không hiển nhiên.
- Comment giải thích **tại sao**, không lặp lại code.

---

## 12. Checklist trước khi mở PR

- [ ] Không hardcode màu/px — dùng token theme.
- [ ] Dùng common components, không dựng lại bảng/nút xóa thủ công.
- [ ] Có đủ trạng thái loading / empty / error.
- [ ] Nút async có `loading`; hành động có `notify`.
- [ ] Module mới đã khai báo trong `navigation.tsx`.
- [ ] Responsive ở mobile; icon-only có tooltip.
- [ ] `npm run build` pass (tsc + vite).
- [ ] Không thêm code Bootstrap mới.

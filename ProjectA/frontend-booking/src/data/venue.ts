/** Thông tin sân (mock). Khi có BE, lấy từ API cấu hình sân. */
export interface Venue {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  openHours: string;
  amenities: string[];
  /** Chuỗi tìm kiếm trên Google Maps (địa chỉ hoặc "lat,lng"). */
  mapQuery: string;
}

export const venue: Venue = {
  name: "Sân Cầu Lông ProjectA",
  tagline: "Hệ thống sân cầu lông tiêu chuẩn thi đấu",
  description:
    "Cụm sân cầu lông trong nhà với mặt sân thảm chuyên dụng, hệ thống đèn chống chói, " +
    "thoáng mát và đầy đủ tiện ích. Phù hợp cho tập luyện, giao lưu và tổ chức giải đấu.",
  address: "123 Đường Cầu Lông, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  phone: "0782 031 031",
  openHours: "05:00 – 24:00 hằng ngày",
  amenities: [
    "10 sân thảm tiêu chuẩn",
    "Đèn chống chói",
    "Bãi giữ xe rộng",
    "Phòng thay đồ & nước uống",
    "Cho thuê vợt, bán cầu",
    "Wifi miễn phí",
  ],
  // Toạ độ/địa chỉ để nhúng bản đồ & chỉ đường.
  mapQuery: "10.776889,106.700806",
};

namespace ProjectA.Models
{
    /// <summary>
    /// Lượt đặt sân. Denormalized (courtName / customerName / customerPhone dạng chuỗi)
    /// để khớp dữ liệu FE; có thể chuẩn hóa thành FK sau.
    /// </summary>
    public class Booking
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;       // BK-xxxx
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CourtName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;       // ISO yyyy-mm-dd
        public string StartTime { get; set; } = string.Empty;  // HH:mm
        public string EndTime { get; set; } = string.Empty;    // HH:mm
        public string Status { get; set; } = "pending";        // pending|confirmed|playing|completed|cancelled|no-show
        public decimal TotalPrice { get; set; }
        public string? CancelReason { get; set; }
    }
}

namespace ProjectA.Models
{
    /// <summary>Khoản thu gắn với lượt đặt sân (booking) hoặc đơn bán hàng (order).</summary>
    public class Payment
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;     // PT-xxxx
        public string Source { get; set; } = string.Empty;   // booking | order
        public string RefId { get; set; } = string.Empty;
        public string RefCode { get; set; } = string.Empty;  // BK-… / HD-…
        public string? CustomerName { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = "cash";         // cash | qr | ewallet | card
        public string Status { get; set; } = "pending";      // pending | paid | failed | refunded
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Note { get; set; }
    }
}

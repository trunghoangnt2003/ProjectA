namespace ProjectA.Models
{
    /// <summary>Khung giá theo giờ trong ngày. End = "24:00" nghĩa là hết ngày.</summary>
    public class PriceSlot
    {
        public string Start { get; set; } = string.Empty; // "HH:mm"
        public string End { get; set; } = string.Empty;   // "HH:mm"
        public decimal PricePerHour { get; set; }
    }

    public class Court
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Zone { get; set; } = string.Empty;        // khu vực
        public string Type { get; set; } = "standard";          // standard | vip | competition
        public string? ImageUrl { get; set; }
        public List<PriceSlot> PriceSlots { get; set; } = new(); // giá theo khung giờ (giờ cao điểm)
        public int WeekendSurcharge { get; set; }               // % phụ thu cuối tuần
        public int HolidaySurcharge { get; set; }               // % phụ thu ngày lễ
        public int MemberDiscount { get; set; }                 // % giảm cho thành viên
        public string Status { get; set; } = "available";       // available | occupied | maintenance
        public string? Note { get; set; }
    }
}

namespace ProjectA.Dtos.Court
{
    public class PriceSlotDto
    {
        public string Start { get; set; } = string.Empty;
        public string End { get; set; } = string.Empty;
        public decimal PricePerHour { get; set; }
    }

    public class CourtDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Zone { get; set; } = string.Empty;
        public string Type { get; set; } = "standard";
        public string? ImageUrl { get; set; }
        public List<PriceSlotDto> PriceSlots { get; set; } = new();
        public int WeekendSurcharge { get; set; }
        public int HolidaySurcharge { get; set; }
        public int MemberDiscount { get; set; }
        public string Status { get; set; } = "available";
        public string? Note { get; set; }
    }
}

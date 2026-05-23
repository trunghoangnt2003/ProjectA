using System.ComponentModel.DataAnnotations;

namespace ProjectA.Dtos.Public
{
    public class PublicCourtDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Zone { get; set; } = string.Empty;
        public string Type { get; set; } = "standard";
        public string? ImageUrl { get; set; }
        public List<PublicPriceSlotDto> PriceSlots { get; set; } = new();
        public int WeekendSurcharge { get; set; }
        public int HolidaySurcharge { get; set; }
        public int MemberDiscount { get; set; }
        public string Status { get; set; } = "available";
    }

    public class PublicPriceSlotDto
    {
        public string Start { get; set; } = string.Empty;
        public string End { get; set; } = string.Empty;
        public decimal PricePerHour { get; set; }
    }

    public class PublicBookingDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string CourtName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = "pending";
    }

    public class CreatePublicBookingRequest
    {
        [Required]
        public string Date { get; set; } = string.Empty;

        [Required]
        public string CourtName { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public string StartTime { get; set; } = string.Empty;

        [Required]
        public string EndTime { get; set; } = string.Empty;

        public decimal TotalPrice { get; set; }
    }

    public class PublicProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}

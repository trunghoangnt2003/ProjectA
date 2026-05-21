using System.ComponentModel.DataAnnotations;

namespace ProjectA.Dtos.Court
{
    public class UpdateCourtRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Zone { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Type { get; set; } = "standard";

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public List<PriceSlotDto> PriceSlots { get; set; } = new();

        [Range(0, 100)]
        public int WeekendSurcharge { get; set; }

        [Range(0, 100)]
        public int HolidaySurcharge { get; set; }

        [Range(0, 100)]
        public int MemberDiscount { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "available";

        [MaxLength(500)]
        public string? Note { get; set; }
    }
}

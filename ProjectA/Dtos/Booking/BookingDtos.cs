using System.ComponentModel.DataAnnotations;

namespace ProjectA.Dtos.Booking
{
    public class BookingDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CourtName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";
        public decimal TotalPrice { get; set; }
        public string? CancelReason { get; set; }
    }

    public class CreateBookingRequest
    {
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string CustomerPhone { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string CourtName { get; set; } = string.Empty;

        [Required]
        public string Date { get; set; } = string.Empty;

        [Required]
        public string StartTime { get; set; } = string.Empty;

        [Required]
        public string EndTime { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Status { get; set; } = "pending";

        public decimal TotalPrice { get; set; }

        [MaxLength(500)]
        public string? CancelReason { get; set; }
    }

    public class UpdateBookingRequest : CreateBookingRequest
    {
    }
}

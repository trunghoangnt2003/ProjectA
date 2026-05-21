using System.ComponentModel.DataAnnotations;

namespace ProjectA.Dtos.Payment
{
    public class PaymentDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string RefId { get; set; } = string.Empty;
        public string RefCode { get; set; } = string.Empty;
        public string? CustomerName { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = "cash";
        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Note { get; set; }
    }

    public class CreatePaymentRequest
    {
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Source { get; set; } = string.Empty; // booking | order

        [MaxLength(50)]
        public string RefId { get; set; } = string.Empty;

        [MaxLength(20)]
        public string RefCode { get; set; } = string.Empty;

        [MaxLength(120)]
        public string? CustomerName { get; set; }

        public decimal Amount { get; set; }

        [MaxLength(20)]
        public string Method { get; set; } = "cash";

        [MaxLength(20)]
        public string Status { get; set; } = "pending";

        public DateTime? CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }
    }

    public class UpdatePaymentRequest : CreatePaymentRequest
    {
    }
}

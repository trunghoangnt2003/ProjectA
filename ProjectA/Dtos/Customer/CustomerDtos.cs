using System.ComponentModel.DataAnnotations;

namespace ProjectA.Dtos.Customer
{
    public class CustomerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public List<string> Tags { get; set; } = new();
        public int LoyaltyPoints { get; set; }
        public decimal Debt { get; set; }
        public string? Note { get; set; }
        public bool Locked { get; set; }
        public int TotalBookings { get; set; }
        public string JoinedAt { get; set; } = string.Empty;
    }

    public class CreateCustomerRequest
    {
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Email { get; set; }

        public List<string> Tags { get; set; } = new();
        public int LoyaltyPoints { get; set; }
        public decimal Debt { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }

        public bool Locked { get; set; }
        public int TotalBookings { get; set; }
        public string JoinedAt { get; set; } = string.Empty;
    }

    public class UpdateCustomerRequest : CreateCustomerRequest
    {
    }
}

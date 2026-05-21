namespace ProjectA.Models
{
    public class Customer
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public List<string> Tags { get; set; } = new(); // vip | frequent | bad-debt | new
        public int LoyaltyPoints { get; set; }
        public decimal Debt { get; set; }               // công nợ (₫)
        public string? Note { get; set; }
        public bool Locked { get; set; }
        public int TotalBookings { get; set; }
        public string JoinedAt { get; set; } = string.Empty; // ISO yyyy-mm-dd
    }
}

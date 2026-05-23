namespace ProjectA.Models
{
    public class Rental
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty; // TH-xxxx
        public Guid ItemId { get; set; } // ID of Supply
        public string ItemName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public int Quantity { get; set; }
        public decimal Fee { get; set; }
        public decimal Deposit { get; set; }
        public DateTime BorrowedAt { get; set; }
        public DateTime? DueAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public string Status { get; set; } = "borrowed"; // "borrowed" or "returned"
        public string? Note { get; set; }
    }
}

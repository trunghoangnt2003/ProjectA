namespace ProjectA.Models
{
    public class StockMovement
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string ItemSource { get; set; } = "product"; // "product" or "supply"
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string Type { get; set; } = "in"; // "in", "out", "adjust"
        public int Quantity { get; set; } // Always > 0, direction is determined by Type
        public int BalanceAfter { get; set; }
        public string? Reason { get; set; }
    }
}

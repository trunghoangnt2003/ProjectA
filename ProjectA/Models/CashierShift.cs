namespace ProjectA.Models
{
    public class CashierShift
    {
        public Guid Id { get; set; }
        public string Cashier { get; set; } = null!;
        public DateTime OpenedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public decimal OpeningCash { get; set; }
        public decimal? CountedCash { get; set; }
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
    }
}

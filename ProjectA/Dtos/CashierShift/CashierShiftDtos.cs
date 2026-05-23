namespace ProjectA.Dtos.CashierShift
{
    public class CashierShiftDto
    {
        public Guid Id { get; set; }
        public string Cashier { get; set; } = null!;
        public string OpenedAt { get; set; } = null!;
        public string? ClosedAt { get; set; }
        public decimal OpeningCash { get; set; }
        public decimal? CountedCash { get; set; }
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
    }

    public class CreateCashierShiftRequest
    {
        public string Cashier { get; set; } = null!;
        public string OpenedAt { get; set; } = null!;
        public string? ClosedAt { get; set; }
        public decimal OpeningCash { get; set; }
        public decimal? CountedCash { get; set; }
        public string Status { get; set; } = null!;
        public string? Note { get; set; }
    }

    public class UpdateCashierShiftRequest : CreateCashierShiftRequest { }
}

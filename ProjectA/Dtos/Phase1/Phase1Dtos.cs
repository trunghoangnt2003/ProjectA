using ProjectA.Models;

namespace ProjectA.Dtos.Phase1
{
    public class ComboDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public bool Active { get; set; }
        public List<ComboLineDto> Lines { get; set; } = new();
    }

    public class ComboLineDto
    {
        public Guid RefId { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }

    public class CreateComboRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public bool Active { get; set; } = true;
        public List<ComboLineDto> Lines { get; set; } = new();
    }

    public class RentalDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public int Quantity { get; set; }
        public decimal Fee { get; set; }
        public decimal Deposit { get; set; }
        public DateTime BorrowedAt { get; set; }
        public DateTime? DueAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
    }

    public class CreateRentalRequest
    {
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public int Quantity { get; set; }
        public decimal Fee { get; set; }
        public decimal Deposit { get; set; }
        public DateTime BorrowedAt { get; set; }
        public DateTime? DueAt { get; set; }
        public string? Note { get; set; }
    }

    public class StockMovementDto
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ItemSource { get; set; } = string.Empty;
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int BalanceAfter { get; set; }
        public string? Reason { get; set; }
    }

    public class CreateStockMovementRequest
    {
        public string ItemSource { get; set; } = string.Empty;
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? Reason { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace ProjectA.Dtos.Order
{
    public class OrderLineDto
    {
        public string RefId { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty; // product | supply | combo
        public string Name { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
    }

    public class OrderDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? CustomerName { get; set; }
        public string? CourtName { get; set; }
        public List<OrderLineDto> Lines { get; set; } = new();
        public decimal Total { get; set; }
    }

    public class CreateOrderRequest
    {
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        public DateTime? CreatedAt { get; set; }

        [MaxLength(120)]
        public string? CustomerName { get; set; }

        [MaxLength(100)]
        public string? CourtName { get; set; }

        [MinLength(1)]
        public List<OrderLineDto> Lines { get; set; } = new();

        public decimal Total { get; set; }
    }
}

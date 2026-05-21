namespace ProjectA.Models
{
    /// <summary>Một dòng hàng trong hóa đơn bán hàng (POS).</summary>
    public class OrderLine
    {
        public string RefId { get; set; } = string.Empty;   // id Product/Supply/Combo nguồn
        public string Source { get; set; } = string.Empty;  // product | supply | combo
        public string Name { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
    }

    /// <summary>Hóa đơn bán hàng — trừ kho khi thanh toán, tính vào doanh thu.</summary>
    public class Order
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;     // HD-xxxx
        public DateTime CreatedAt { get; set; }
        public string? CustomerName { get; set; }
        public string? CourtName { get; set; }
        public List<OrderLine> Lines { get; set; } = new();
        public decimal Total { get; set; }
    }
}

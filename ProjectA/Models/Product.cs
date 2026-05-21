namespace ProjectA.Models
{
    /// <summary>Hàng hóa bán cho khách: đồ uống, đồ ăn… (FE gọi là "Hàng hóa").</summary>
    public class Product
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Nước suối | Nước ngọt | Đồ ăn…
        public decimal Price { get; set; }                   // giá bán
        public int Stock { get; set; }                       // tồn kho
    }
}

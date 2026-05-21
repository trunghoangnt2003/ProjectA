namespace ProjectA.Models
{
    /// <summary>Vật tư: forSale=true là vật tư bán (có giá), false là vật tư phục vụ sân.</summary>
    public class Supply
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Cầu | Cước | Vợt | Lưới | Giày | Phụ kiện
        public int Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;     // ống | cuộn | cây | cái | đôi
        public int ReorderLevel { get; set; }                // ngưỡng cảnh báo nhập thêm
        public bool ForSale { get; set; }
        public decimal? SalePrice { get; set; }              // giá bán — khi ForSale
    }
}

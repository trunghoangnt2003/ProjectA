using System.ComponentModel.DataAnnotations;

namespace ProjectA.Dtos.Supply
{
    public class SupplyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public int ReorderLevel { get; set; }
        public bool ForSale { get; set; }
        public decimal? SalePrice { get; set; }
    }

    public class CreateSupplyRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        [MaxLength(20)]
        public string Unit { get; set; } = string.Empty;

        [Range(0, int.MaxValue)]
        public int ReorderLevel { get; set; }

        public bool ForSale { get; set; }
        public decimal? SalePrice { get; set; }
    }

    public class UpdateSupplyRequest : CreateSupplyRequest
    {
    }
}

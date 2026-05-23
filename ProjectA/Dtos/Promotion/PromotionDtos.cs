namespace ProjectA.Dtos.Promotion
{
    public class PromotionDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Type { get; set; } = null!; // percentage | fixed | free-service | cashback
        public decimal Value { get; set; }
        public string? Description { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? TimeStart { get; set; }
        public string? TimeEnd { get; set; }
        public decimal? MinOrder { get; set; }
        public int? MaxUses { get; set; }
        public int UsedCount { get; set; }
        public bool Active { get; set; }
    }

    public class CreatePromotionRequest
    {
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Type { get; set; } = null!;
        public decimal Value { get; set; }
        public string? Description { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? TimeStart { get; set; }
        public string? TimeEnd { get; set; }
        public decimal? MinOrder { get; set; }
        public int? MaxUses { get; set; }
        public bool Active { get; set; }
    }

    public class UpdatePromotionRequest : CreatePromotionRequest { }
}

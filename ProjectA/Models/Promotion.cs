namespace ProjectA.Models
{
    public class Promotion
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Type { get; set; } = null!; // percentage | fixed | free-service | cashback
        public decimal Value { get; set; }
        public string? Description { get; set; }
        
        public string? StartDate { get; set; } // yyyy-mm-dd
        public string? EndDate { get; set; } // yyyy-mm-dd
        
        public string? TimeStart { get; set; } // HH:mm
        public string? TimeEnd { get; set; } // HH:mm
        
        public decimal? MinOrder { get; set; }
        public int? MaxUses { get; set; }
        public int UsedCount { get; set; }
        public bool Active { get; set; }
    }
}

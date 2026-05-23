namespace ProjectA.Models
{
    public class MembershipPlan
    {
        public Guid Id { get; set; }
        public string Level { get; set; } = null!; // basic | silver | gold | platinum
        public string Name { get; set; } = null!;
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
        public decimal DiscountPercent { get; set; }
        public List<string> Benefits { get; set; } = new();
        public bool Active { get; set; }
    }
}

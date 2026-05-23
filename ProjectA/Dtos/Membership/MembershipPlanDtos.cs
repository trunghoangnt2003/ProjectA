namespace ProjectA.Dtos.Membership
{
    public class MembershipPlanDto
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

    public class CreateMembershipPlanRequest
    {
        public string Level { get; set; } = null!;
        public string Name { get; set; } = null!;
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
        public decimal DiscountPercent { get; set; }
        public List<string> Benefits { get; set; } = new();
        public bool Active { get; set; }
    }

    public class UpdateMembershipPlanRequest : CreateMembershipPlanRequest { }
}

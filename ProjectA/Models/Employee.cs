namespace ProjectA.Models
{
    public class Employee
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Position { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Shift { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime JoinedAt { get; set; }
        public decimal ShiftRate { get; set; }
    }
}

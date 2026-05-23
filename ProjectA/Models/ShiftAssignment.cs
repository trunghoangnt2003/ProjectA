namespace ProjectA.Models
{
    public class ShiftAssignment
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public string EmployeeName { get; set; } = null!;
        public DateTime Date { get; set; }
        public string Shift { get; set; } = null!;
    }
}

namespace ProjectA.Models
{
    public class Attendance
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public string EmployeeName { get; set; } = null!;
        public DateTime Date { get; set; }
        public string Shift { get; set; } = null!;
        public string Status { get; set; } = null!;
        public TimeSpan? CheckIn { get; set; }
        public TimeSpan? CheckOut { get; set; }
    }
}

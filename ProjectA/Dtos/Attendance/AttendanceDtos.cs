namespace ProjectA.Dtos.Attendance
{
    public class AttendanceDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public string Date { get; set; } = null!; // yyyy-MM-dd
        public string Shift { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? CheckIn { get; set; }
        public string? CheckOut { get; set; }
    }

    public class CreateAttendanceRequest
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public string Date { get; set; } = null!;
        public string Shift { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? CheckIn { get; set; }
        public string? CheckOut { get; set; }
    }

    public class UpdateAttendanceRequest : CreateAttendanceRequest { }
}

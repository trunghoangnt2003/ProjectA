namespace ProjectA.Dtos.Roster
{
    public class ShiftAssignmentDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public string Date { get; set; } = null!; // yyyy-MM-dd
        public string Shift { get; set; } = null!;
    }

    public class CreateShiftAssignmentRequest
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = null!;
        public string Date { get; set; } = null!;
        public string Shift { get; set; } = null!;
    }

    public class UpdateShiftAssignmentRequest : CreateShiftAssignmentRequest { }
}

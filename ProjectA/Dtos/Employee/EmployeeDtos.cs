namespace ProjectA.Dtos.Employee
{
    public class EmployeeDto
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

    public class CreateEmployeeRequest
    {
        public string Name { get; set; } = null!;
        public string Position { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Shift { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime JoinedAt { get; set; }
        public decimal ShiftRate { get; set; }
    }

    public class UpdateEmployeeRequest : CreateEmployeeRequest { }
}

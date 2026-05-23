namespace ProjectA.Dtos.Payroll
{
    public class PayrollRowDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Position { get; set; } = null!;
        public int Worked { get; set; }
        public int Absent { get; set; }
        public int OnTime { get; set; } // Percentage
        public decimal ShiftRate { get; set; }
        public decimal Salary { get; set; }
    }
}

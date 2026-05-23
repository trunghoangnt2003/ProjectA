namespace ProjectA.Models
{
    public class AutomationRule
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Channel { get; set; } = null!; // email | sms | push | zalo
        public bool Enabled { get; set; }
    }
}

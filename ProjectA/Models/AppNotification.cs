namespace ProjectA.Models
{
    public class AppNotification
    {
        public Guid Id { get; set; }
        public string Channel { get; set; } = null!; // email | sms | push | zalo
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string Audience { get; set; } = null!;
        public int Recipients { get; set; }
        public string Status { get; set; } = null!; // sent | scheduled | failed
        public string CreatedAt { get; set; } = null!; // ISO datetime
        public string? SentAt { get; set; } // ISO datetime
    }
}

namespace ProjectA.Dtos.Notification
{
    public class AppNotificationDto
    {
        public Guid Id { get; set; }
        public string Channel { get; set; } = null!; // email | sms | push | zalo
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string Audience { get; set; } = null!;
        public int Recipients { get; set; }
        public string Status { get; set; } = null!; // sent | scheduled | failed
        public string CreatedAt { get; set; } = null!;
        public string? SentAt { get; set; }
    }

    public class CreateAppNotificationRequest
    {
        public string Channel { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string Audience { get; set; } = null!;
        public int Recipients { get; set; }
        public string Status { get; set; } = null!;
        public string CreatedAt { get; set; } = null!;
        public string? SentAt { get; set; }
    }
    
    public class AutomationRuleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Channel { get; set; } = null!;
        public bool Enabled { get; set; }
    }

    public class UpdateAutomationRuleRequest
    {
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Channel { get; set; } = null!;
        public bool Enabled { get; set; }
    }
}

namespace ProjectA.Models
{
    public class RefreshToken
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public ApplicationUser User { get; set; } = null!;

        public string Token { get; set; } = string.Empty;

        public DateTime ExpiresAtUtc { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public DateTime? RevokedAtUtc { get; set; }

        public string? ReplacedByToken { get; set; }

        public bool IsActive => RevokedAtUtc is null && DateTime.UtcNow < ExpiresAtUtc;
    }
}

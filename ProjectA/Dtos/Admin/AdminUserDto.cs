namespace ProjectA.Dtos.Admin
{
    public class AdminUserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public bool IsAdminApproved { get; set; }
        public IEnumerable<string> Roles { get; set; } = Array.Empty<string>();
        public IEnumerable<string> DirectPermissions { get; set; } = Array.Empty<string>();
    }
}

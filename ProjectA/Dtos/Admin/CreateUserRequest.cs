namespace ProjectA.Dtos.Admin
{
    public class CreateUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool IsAdminApproved { get; set; }
    }
}

namespace ProjectA.Dtos.Admin
{
    public class RoleDto
    {
        public string Name { get; set; } = string.Empty;
        public IEnumerable<string> Permissions { get; set; } = Array.Empty<string>();
    }
}

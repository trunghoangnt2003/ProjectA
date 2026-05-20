using Microsoft.AspNetCore.Identity;

namespace ProjectA.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public bool IsAdminApproved { get; set; }
    }
}

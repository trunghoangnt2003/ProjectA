using Microsoft.AspNetCore.Identity;

namespace ProjectA.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public bool IsAdminApproved { get; set; }

        /// <summary>
        /// Ca làm việc của nhân viên: "S1" | "S2" | "S3" (xem <see cref="Authorization.WorkShifts"/>).
        /// Quyết định khung giờ nhân viên được phép thao tác (RBAC theo ca).
        /// </summary>
        public string? Shift { get; set; }
    }
}

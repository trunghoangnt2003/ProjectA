using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using ProjectA.Models;

namespace ProjectA.Authorization
{
    public class BusinessHoursApprovalHandler : AuthorizationHandler<BusinessHoursApprovalRequirement>
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public BusinessHoursApprovalHandler(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            BusinessHoursApprovalRequirement requirement)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                context.Fail(new AuthorizationFailureReason(this, "Missing user id."));
                return;
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user is null)
            {
                context.Fail(new AuthorizationFailureReason(this, "User not found."));
                return;
            }

            if (!user.IsAdminApproved)
            {
                context.Fail(new AuthorizationFailureReason(this, "User is not approved by admin."));
                return;
            }

            if (!WorkShifts.TryGet(user.Shift, out var shift))
            {
                context.Fail(new AuthorizationFailureReason(this, "Nhân viên chưa được phân ca làm việc."));
                return;
            }

            var now = TimeOnly.FromDateTime(DateTime.Now);
            var start = shift.Start;
            var end = shift.End;

            // Logic giữ nguyên như rule giờ hành chính cũ; chỉ đổi nguồn khung giờ sang ca làm.
            // Start > End => ca qua nửa đêm (vd S2 17:00–24:00).
            var within = start <= end
                ? now >= start && now <= end
                : now >= start || now <= end;

            if (within)
            {
                context.Succeed(requirement);
                return;
            }

            context.Fail(new AuthorizationFailureReason(this, "Chỉ được thao tác trong ca làm việc của bạn."));
        }
    }
}

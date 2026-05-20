using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using ProjectA.Models;
using ProjectA.Options;

namespace ProjectA.Authorization
{
    public class BusinessHoursApprovalHandler : AuthorizationHandler<BusinessHoursApprovalRequirement>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly BusinessHoursOptions _options;

        public BusinessHoursApprovalHandler(
            UserManager<ApplicationUser> userManager,
            IOptions<BusinessHoursOptions> options)
        {
            _userManager = userManager;
            _options = options.Value;
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

            var now = TimeOnly.FromDateTime(DateTime.Now);
            var start = _options.Start;
            var end = _options.End;

            var within = start <= end
                ? now >= start && now <= end
                : now >= start || now <= end;

            if (within)
            {
                context.Succeed(requirement);
                return;
            }

            context.Fail(new AuthorizationFailureReason(this, "Access allowed only during business hours."));
        }
    }
}

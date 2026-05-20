using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace ProjectA.Authorization
{
    public class AuthorizationFailureResultHandler : IAuthorizationMiddlewareResultHandler
    {
        private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

        public async Task HandleAsync(
            RequestDelegate next,
            HttpContext context,
            AuthorizationPolicy policy,
            PolicyAuthorizationResult authorizeResult)
        {
            if (authorizeResult.Succeeded)
            {
                await next(context);
                return;
            }

            if (authorizeResult.Challenged)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Unauthorized",
                    reasons = new[] { "Authentication required." }
                });
                return;
            }

            if (authorizeResult.Forbidden)
            {
                var reasons = authorizeResult.AuthorizationFailure?.FailureReasons
                    .Select(r => r.Message)
                    .Where(r => !string.IsNullOrWhiteSpace(r))
                    .Distinct()
                    .ToArray()
                    ?? Array.Empty<string>();

                if (reasons.Length == 0)
                {
                    reasons = new[] { "Access denied." };
                }

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Forbidden",
                    reasons
                });
                return;
            }

            await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
        }
    }
}

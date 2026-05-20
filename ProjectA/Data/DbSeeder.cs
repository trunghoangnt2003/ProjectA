using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using ProjectA.Authorization;
using ProjectA.Models;
using ProjectA.Options;

namespace ProjectA.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var options = services.GetRequiredService<IOptions<AdminSeedOptions>>().Value;
            if (string.IsNullOrWhiteSpace(options.Email) || string.IsNullOrWhiteSpace(options.Password))
            {
                return;
            }

            var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

            var adminRole = await EnsureRoleAsync(roleManager, "Admin");
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.ProductAll);

            var user = await userManager.FindByEmailAsync(options.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = options.Email,
                    Email = options.Email,
                    IsAdminApproved = true
                };

                var createResult = await userManager.CreateAsync(user, options.Password);
                if (!createResult.Succeeded)
                {
                    return;
                }
            }
            else if (!user.IsAdminApproved)
            {
                user.IsAdminApproved = true;
                await userManager.UpdateAsync(user);
            }

            if (!await userManager.IsInRoleAsync(user, adminRole.Name ?? "Admin"))
            {
                await userManager.AddToRoleAsync(user, adminRole.Name ?? "Admin");
            }
        }

        private static async Task<IdentityRole<Guid>> EnsureRoleAsync(
            RoleManager<IdentityRole<Guid>> roleManager,
            string roleName)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role is not null)
            {
                return role;
            }

            role = new IdentityRole<Guid>(roleName);
            await roleManager.CreateAsync(role);
            return role;
        }

        private static async Task EnsureRolePermissionAsync(
            RoleManager<IdentityRole<Guid>> roleManager,
            IdentityRole<Guid> role,
            string permission)
        {
            var claims = await roleManager.GetClaimsAsync(role);
            if (claims.Any(c => c.Type == PermissionConstants.ClaimType && c.Value == permission))
            {
                return;
            }

            await roleManager.AddClaimAsync(role, new System.Security.Claims.Claim(PermissionConstants.ClaimType, permission));
        }
    }
}

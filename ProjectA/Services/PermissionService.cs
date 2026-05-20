using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Distributed;
using ProjectA.Authorization;
using ProjectA.Models;

namespace ProjectA.Services
{
    public interface IPermissionService
    {
        Task<bool> UserHasPermissionAsync(string userId, string permission);
        Task InvalidateUserAsync(string userId);
    }

    public class PermissionService : IPermissionService
    {
        private static readonly DistributedCacheEntryOptions CacheOptions = new()
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30),
            SlidingExpiration = TimeSpan.FromMinutes(10)
        };

        private readonly IDistributedCache _cache;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;

        public PermissionService(
            IDistributedCache cache,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager)
        {
            _cache = cache;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<bool> UserHasPermissionAsync(string userId, string permission)
        {
            var permissions = await GetPermissionsAsync(userId);
            if (permissions.Contains(permission, StringComparer.OrdinalIgnoreCase))
            {
                return true;
            }

            return HasWildcardPermission(permissions, permission);
        }

        public Task InvalidateUserAsync(string userId)
        {
            return _cache.RemoveAsync(GetCacheKey(userId));
        }

        private async Task<HashSet<string>> GetPermissionsAsync(string userId)
        {
            var cacheKey = GetCacheKey(userId);
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrWhiteSpace(cached))
            {
                var restored = JsonSerializer.Deserialize<HashSet<string>>(cached);
                if (restored is not null)
                {
                    return restored;
                }
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user is null)
            {
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            }

            var permissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var userClaims = await _userManager.GetClaimsAsync(user);
            foreach (var claim in userClaims.Where(c => c.Type == PermissionConstants.ClaimType))
            {
                permissions.Add(claim.Value);
            }

            var roles = await _userManager.GetRolesAsync(user);
            foreach (var roleName in roles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role is null)
                {
                    continue;
                }

                var roleClaims = await _roleManager.GetClaimsAsync(role);
                foreach (var claim in roleClaims.Where(c => c.Type == PermissionConstants.ClaimType))
                {
                    permissions.Add(claim.Value);
                }
            }

            var serialized = JsonSerializer.Serialize(permissions);
            await _cache.SetStringAsync(cacheKey, serialized, CacheOptions);

            return permissions;
        }

        private static string GetCacheKey(string userId) => $"permissions:{userId}";

        private static bool HasWildcardPermission(HashSet<string> permissions, string permission)
        {
            var lastDotIndex = permission.LastIndexOf('.');
            if (lastDotIndex <= 0)
            {
                return false;
            }

            var wildcard = $"{permission[..lastDotIndex]}.*";
            return permissions.Contains(wildcard, StringComparer.OrdinalIgnoreCase);
        }
    }
}

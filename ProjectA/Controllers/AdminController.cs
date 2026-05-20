using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Admin;
using ProjectA.Models;
using ProjectA.Services;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IPermissionService _permissionService;
        private readonly AppDbContext _dbContext;

        public AdminController(
            RoleManager<IdentityRole<Guid>> roleManager,
            UserManager<ApplicationUser> userManager,
            IPermissionService permissionService,
            AppDbContext dbContext)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _permissionService = permissionService;
            _dbContext = dbContext;
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var result = new List<AdminUserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var claims = await _userManager.GetClaimsAsync(user);

                result.Add(new AdminUserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    IsAdminApproved = user.IsAdminApproved,
                    Roles = roles,
                    DirectPermissions = claims
                        .Where(c => c.Type == PermissionConstants.ClaimType)
                        .Select(c => c.Value)
                        .ToArray()
                });
            }

            return Ok(result);
        }

        [HttpPost("users")]
        public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] CreateUserRequest request)
        {
            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing is not null)
            {
                return BadRequest("Email already exists.");
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                IsAdminApproved = request.IsAdminApproved
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            return Ok(new AdminUserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                IsAdminApproved = user.IsAdminApproved,
                Roles = Array.Empty<string>(),
                DirectPermissions = Array.Empty<string>()
            });
        }

        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            var result = new List<RoleDto>();

            foreach (var role in roles)
            {
                var claims = await _roleManager.GetClaimsAsync(role);
                result.Add(new RoleDto
                {
                    Name = role.Name ?? string.Empty,
                    Permissions = claims
                        .Where(c => c.Type == PermissionConstants.ClaimType)
                        .Select(c => c.Value)
                        .ToArray()
                });
            }

            return Ok(result);
        }

        [HttpPost("roles/{roleName}")]
        public async Task<IActionResult> CreateRole(string roleName)
        {
            if (await _roleManager.RoleExistsAsync(roleName))
            {
                return Ok();
            }

            var result = await _roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            return Ok();
        }

        [HttpPost("users/{userId:guid}/roles/{roleName}")]
        public async Task<IActionResult> AddUserToRole(Guid userId, string roleName)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return NotFound();
            }

            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                return NotFound($"Role '{roleName}' not found.");
            }

            var result = await _userManager.AddToRoleAsync(user, roleName);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            await _permissionService.InvalidateUserAsync(userId.ToString());
            return Ok();
        }

        [HttpDelete("users/{userId:guid}/roles/{roleName}")]
        public async Task<IActionResult> RemoveUserFromRole(Guid userId, string roleName)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return NotFound();
            }

            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                return NotFound($"Role '{roleName}' not found.");
            }

            var result = await _userManager.RemoveFromRoleAsync(user, roleName);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            await _permissionService.InvalidateUserAsync(userId.ToString());
            return Ok();
        }

        [HttpPost("roles/{roleName}/permissions/{permission}")]
        public async Task<IActionResult> AddRolePermission(string roleName, string permission)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role is null)
            {
                return NotFound($"Role '{roleName}' not found.");
            }

            var claims = await _roleManager.GetClaimsAsync(role);
            if (claims.Any(c => c.Type == PermissionConstants.ClaimType && c.Value == permission))
            {
                return Ok();
            }

            var result = await _roleManager.AddClaimAsync(role, new System.Security.Claims.Claim(PermissionConstants.ClaimType, permission));
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            await InvalidateRoleUsersAsync(role);
            return Ok();
        }

        [HttpDelete("roles/{roleName}/permissions/{permission}")]
        public async Task<IActionResult> RemoveRolePermission(string roleName, string permission)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role is null)
            {
                return NotFound($"Role '{roleName}' not found.");
            }

            var claims = await _roleManager.GetClaimsAsync(role);
            var claim = claims.FirstOrDefault(c => c.Type == PermissionConstants.ClaimType && c.Value == permission);
            if (claim is null)
            {
                return Ok();
            }

            var result = await _roleManager.RemoveClaimAsync(role, claim);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            await InvalidateRoleUsersAsync(role);
            return Ok();
        }

        [HttpPost("users/{userId:guid}/permissions/{permission}")]
        public async Task<IActionResult> AddUserPermission(Guid userId, string permission)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return NotFound();
            }

            var claims = await _userManager.GetClaimsAsync(user);
            if (claims.Any(c => c.Type == PermissionConstants.ClaimType && c.Value == permission))
            {
                return Ok();
            }

            var result = await _userManager.AddClaimAsync(user, new System.Security.Claims.Claim(PermissionConstants.ClaimType, permission));
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            await _permissionService.InvalidateUserAsync(userId.ToString());
            return Ok();
        }

        [HttpDelete("users/{userId:guid}/permissions/{permission}")]
        public async Task<IActionResult> RemoveUserPermission(Guid userId, string permission)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return NotFound();
            }

            var claims = await _userManager.GetClaimsAsync(user);
            var claim = claims.FirstOrDefault(c => c.Type == PermissionConstants.ClaimType && c.Value == permission);
            if (claim is null)
            {
                return Ok();
            }

            var result = await _userManager.RemoveClaimAsync(user, claim);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            await _permissionService.InvalidateUserAsync(userId.ToString());
            return Ok();
        }

        [HttpPost("users/{userId:guid}/approve")]
        public async Task<IActionResult> ApproveUser(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return NotFound();
            }

            if (!user.IsAdminApproved)
            {
                user.IsAdminApproved = true;
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors.Select(e => e.Description));
                }
            }

            return Ok();
        }

        [HttpPost("users/{userId:guid}/revoke-approval")]
        public async Task<IActionResult> RevokeApproval(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return NotFound();
            }

            if (user.IsAdminApproved)
            {
                user.IsAdminApproved = false;
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors.Select(e => e.Description));
                }
            }

            return Ok();
        }

        private async Task InvalidateRoleUsersAsync(IdentityRole<Guid> role)
        {
            var userIds = await _dbContext.UserRoles
                .Where(ur => ur.RoleId == role.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();

            foreach (var userId in userIds)
            {
                await _permissionService.InvalidateUserAsync(userId.ToString());
            }
        }
    }
}

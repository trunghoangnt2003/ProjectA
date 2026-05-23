using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ProjectA.Authorization;
using ProjectA.Models;
using ProjectA.Options;

namespace ProjectA.Data
{
    public static partial class DbSeeder
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
            var dbContext = services.GetRequiredService<AppDbContext>();

            // ── Roles & Admin user ──────────────────────────────────────
            var adminRole = await EnsureRoleAsync(roleManager, "Admin");
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.All);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.ProductAll);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.CourtAll);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.CustomerAll);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.BookingAll);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.SupplyAll);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.OrderAll);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.PaymentAll);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.ReportView);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.SaleUse);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.ComboManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.InventoryManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.RentalManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.PromotionManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.MembershipManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.NotificationManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.EmployeeManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.RosterManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.AttendanceManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.PayrollView);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.UserManage);
            await EnsureRolePermissionAsync(roleManager, adminRole, Permissions.RoleManage);

            var isFirstRun = false;
            var user = await userManager.FindByEmailAsync(options.Email);
            if (user is null)
            {
                isFirstRun = true;
                user = new ApplicationUser
                {
                    UserName = options.Email,
                    Email = options.Email,
                    IsAdminApproved = true,
                    Shift = "S1"
                };

                var createResult = await userManager.CreateAsync(user, options.Password);
                if (!createResult.Succeeded)
                {
                    return;
                }
            }
            else if (!user.IsAdminApproved || string.IsNullOrWhiteSpace(user.Shift))
            {
                user.IsAdminApproved = true;
                user.Shift ??= "S1";
                await userManager.UpdateAsync(user);
            }

            if (!await userManager.IsInRoleAsync(user, adminRole.Name ?? "Admin"))
            {
                await userManager.AddToRoleAsync(user, adminRole.Name ?? "Admin");
            }

            // ── Additional roles ────────────────────────────────────────
            var letanRole = await EnsureRoleAsync(roleManager, "LeTan");
            foreach (var p in new[] { "booking.view", "booking.add", "booking.edit", "customer.view", "court.view" })
                await EnsureRolePermissionAsync(roleManager, letanRole, p);

            var phucvuRole = await EnsureRoleAsync(roleManager, "PhucVu");
            foreach (var p in new[] { "product.view", "customer.view", "order.view", "order.add" })
                await EnsureRolePermissionAsync(roleManager, phucvuRole, p);

            var thuNganRole = await EnsureRoleAsync(roleManager, "ThuNgan");
            foreach (var p in new[] { "order.view", "order.add", "payment.view", "payment.add", "payment.edit", "customer.view", "booking.view", "product.view" })
                await EnsureRolePermissionAsync(roleManager, thuNganRole, p);

            var quanLyRole = await EnsureRoleAsync(roleManager, "QuanLy");
            foreach (var p in new[] {
                "court.view", "court.add", "court.edit",
                "booking.view", "booking.add", "booking.edit",
                "customer.view", "customer.add", "customer.edit",
                "product.view", "product.add", "product.edit",
                "supply.view", "supply.add", "supply.edit",
                "order.view", "order.add",
                "payment.view", "payment.add", "payment.edit"
            })
                await EnsureRolePermissionAsync(roleManager, quanLyRole, p);

            // ── Additional users ────────────────────────────────────────
            await EnsureUserAsync(userManager, "letan1@projecta.local", options.Password, true, "S1", "LeTan");
            await EnsureUserAsync(userManager, "phucvu1@projecta.local", options.Password, true, "S2", "PhucVu");

            // ── Domain seed data (only if tables empty) ─────────────────
            if (!await dbContext.AutomationRules.AnyAsync())
            {
                dbContext.AutomationRules.AddRange(
                    new AutomationRule { Id = Guid.NewGuid(), Name = "Nhắc lịch đặt sân", Description = "Gửi trước giờ chơi 2 tiếng.", Channel = "sms", Enabled = true },
                    new AutomationRule { Id = Guid.NewGuid(), Name = "Nhắc thanh toán", Description = "Nhắc khi có công nợ chưa thanh toán.", Channel = "zalo", Enabled = true },
                    new AutomationRule { Id = Guid.NewGuid(), Name = "Chiến dịch khuyến mãi", Description = "Gửi khi có khuyến mãi mới kích hoạt.", Channel = "email", Enabled = false },
                    new AutomationRule { Id = Guid.NewGuid(), Name = "Chúc mừng sinh nhật", Description = "Tặng voucher vào ngày sinh nhật khách.", Channel = "zalo", Enabled = true }
                );
                await dbContext.SaveChangesAsync();
            }

            await SeedDomainDataAsync(dbContext);
        }

        private static async Task EnsureUserAsync(
            UserManager<ApplicationUser> userManager,
            string email, string password, bool approved, string shift, string roleName)
        {
            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null) return;

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                IsAdminApproved = approved,
                Shift = shift,
            };
            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, roleName);
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

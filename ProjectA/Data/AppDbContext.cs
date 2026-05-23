using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectA.Models;

namespace ProjectA.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Customer> Customers { get; set; } = null!;
        public DbSet<Booking> Bookings { get; set; } = null!;
        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<Supply> Supplies { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<Combo> Combos { get; set; } = null!;
        public DbSet<ComboLine> ComboLines { get; set; } = null!;
        public DbSet<Rental> Rentals { get; set; } = null!;
        public DbSet<StockMovement> StockMovements { get; set; } = null!;
        public DbSet<Employee> Employees { get; set; } = null!;
        public DbSet<ShiftAssignment> ShiftAssignments { get; set; } = null!;
        public DbSet<Attendance> Attendances { get; set; } = null!;
        public DbSet<CashierShift> CashierShifts { get; set; } = null!;

        public DbSet<Promotion> Promotions { get; set; } = null!;
        public DbSet<MembershipPlan> MembershipPlans { get; set; } = null!;
        public DbSet<AppNotification> AppNotifications { get; set; } = null!;
        public DbSet<AutomationRule> AutomationRules { get; set; } = null!;

        public DbSet<Court> Courts => Set<Court>();

        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Product>(entity =>
            {
                entity.Property(p => p.Name)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(p => p.Price)
                    .HasColumnType("numeric(18,2)");
            });

            builder.Entity<Combo>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Price).HasColumnType("numeric(18,2)");
                entity.HasMany(e => e.Lines)
                      .WithOne(e => e.Combo)
                      .HasForeignKey(e => e.ComboId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<Rental>(entity =>
            {
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Fee).HasColumnType("numeric(18,2)");
                entity.Property(e => e.Deposit).HasColumnType("numeric(18,2)");
            });

            builder.Entity<StockMovement>(entity =>
            {
                entity.Property(e => e.Type).HasMaxLength(50);
                entity.Property(e => e.ItemSource).HasMaxLength(50);
            });

            builder.Entity<Court>(entity =>
            {
                entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
                entity.Property(c => c.Zone).HasMaxLength(100);
                entity.Property(c => c.Type).HasMaxLength(30);
                entity.Property(c => c.ImageUrl).HasMaxLength(500);
                entity.Property(c => c.Status).HasMaxLength(30);
                entity.Property(c => c.Note).HasMaxLength(500);

                // Bảng giá theo khung giờ lưu thành cột JSON (jsonb).
                entity.OwnsMany(c => c.PriceSlots, slots =>
                {
                    slots.ToJson();
                    slots.Property(s => s.PricePerHour).HasColumnType("numeric(18,2)");
                });
            });

            builder.Entity<Customer>(entity =>
            {
                entity.Property(c => c.Name).HasMaxLength(120).IsRequired();
                entity.Property(c => c.Phone).HasMaxLength(20).IsRequired();
                entity.Property(c => c.Email).HasMaxLength(200);
                entity.Property(c => c.Note).HasMaxLength(1000);
                entity.Property(c => c.JoinedAt).HasMaxLength(10);
                entity.Property(c => c.Debt).HasColumnType("numeric(18,2)");
                // Tags: collection chuỗi -> jsonb (EF Core 8 primitive collection).
                entity.Property(c => c.Tags).HasColumnType("jsonb");
                entity.HasIndex(c => c.Phone);
            });

            builder.Entity<Booking>(entity =>
            {
                entity.Property(b => b.Code).HasMaxLength(20).IsRequired();
                entity.Property(b => b.CustomerName).HasMaxLength(120);
                entity.Property(b => b.CustomerPhone).HasMaxLength(20);
                entity.Property(b => b.CourtName).HasMaxLength(100);
                entity.Property(b => b.Date).HasMaxLength(10);
                entity.Property(b => b.StartTime).HasMaxLength(5);
                entity.Property(b => b.EndTime).HasMaxLength(5);
                entity.Property(b => b.Status).HasMaxLength(20);
                entity.Property(b => b.CancelReason).HasMaxLength(500);
                entity.Property(b => b.TotalPrice).HasColumnType("numeric(18,2)");
                entity.HasIndex(b => b.Date);
            });

            builder.Entity<Supply>(entity =>
            {
                entity.Property(s => s.Name).HasMaxLength(200).IsRequired();
                entity.Property(s => s.Category).HasMaxLength(50);
                entity.Property(s => s.Unit).HasMaxLength(20);
                entity.Property(s => s.SalePrice).HasColumnType("numeric(18,2)");
            });

            builder.Entity<Order>(entity =>
            {
                entity.Property(o => o.Code).HasMaxLength(20).IsRequired();
                entity.Property(o => o.CustomerName).HasMaxLength(120);
                entity.Property(o => o.CourtName).HasMaxLength(100);
                entity.Property(o => o.Total).HasColumnType("numeric(18,2)");
                entity.OwnsMany(o => o.Lines, lines =>
                {
                    lines.ToJson();
                    lines.Property(l => l.UnitPrice).HasColumnType("numeric(18,2)");
                });
            });

            builder.Entity<Payment>(entity =>
            {
                entity.Property(p => p.Code).HasMaxLength(20).IsRequired();
                entity.Property(p => p.Source).HasMaxLength(20);
                entity.Property(p => p.RefId).HasMaxLength(50);
                entity.Property(p => p.RefCode).HasMaxLength(20);
                entity.Property(p => p.CustomerName).HasMaxLength(120);
                entity.Property(p => p.Method).HasMaxLength(20);
                entity.Property(p => p.Status).HasMaxLength(20);
                entity.Property(p => p.Note).HasMaxLength(500);
                entity.Property(p => p.Amount).HasColumnType("numeric(18,2)");
            });

            builder.Entity<Employee>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(120).IsRequired();
                entity.Property(e => e.Position).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Phone).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Shift).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
                entity.Property(e => e.ShiftRate).HasColumnType("numeric(18,2)");
            });

            builder.Entity<ShiftAssignment>(entity =>
            {
                entity.Property(e => e.EmployeeName).HasMaxLength(120).IsRequired();
                entity.Property(e => e.Shift).HasMaxLength(20).IsRequired();
                entity.HasIndex(e => e.Date);
                entity.HasOne(e => e.Employee).WithMany().HasForeignKey(e => e.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<Attendance>(entity =>
            {
                entity.Property(e => e.EmployeeName).HasMaxLength(120).IsRequired();
                entity.Property(e => e.Shift).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
                entity.HasIndex(e => e.Date);
                entity.HasOne(e => e.Employee).WithMany().HasForeignKey(e => e.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<CashierShift>(entity =>
            {
                entity.Property(e => e.Cashier).HasMaxLength(120).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Note).HasMaxLength(500);
                entity.Property(e => e.OpeningCash).HasColumnType("numeric(18,2)");
                entity.Property(e => e.CountedCash).HasColumnType("numeric(18,2)");
            });

            builder.Entity<Promotion>(entity =>
            {
                entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Value).HasColumnType("numeric(18,2)");
                entity.Property(e => e.MinOrder).HasColumnType("numeric(18,2)");
                entity.HasIndex(e => e.Code).IsUnique();
            });

            builder.Entity<MembershipPlan>(entity =>
            {
                entity.Property(e => e.Level).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Price).HasColumnType("numeric(18,2)");
                entity.Property(e => e.DiscountPercent).HasColumnType("numeric(5,2)");
                entity.Property(e => e.Benefits).HasColumnType("jsonb");
            });

            builder.Entity<AppNotification>(entity =>
            {
                entity.Property(e => e.Channel).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Audience).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            });

            builder.Entity<AutomationRule>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Channel).HasMaxLength(50).IsRequired();
            });

            builder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(t => t.Id);

                entity.Property(t => t.Token)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.HasIndex(t => t.Token)
                    .IsUnique();

                entity.HasIndex(t => t.UserId);

                entity.HasOne(t => t.User)
                    .WithMany()
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}

using Microsoft.EntityFrameworkCore;
using ProjectA.Data;
using ProjectA.Models;

namespace ProjectA.Services
{
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<NotificationBackgroundService> _logger;

        public NotificationBackgroundService(IServiceProvider services, ILogger<NotificationBackgroundService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Notification Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessRulesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing notification rules.");
                }

                // Run every 1 minute
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ProcessRulesAsync(CancellationToken stoppingToken)
        {
            using var scope = _services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var rules = await dbContext.AutomationRules.Where(r => r.Enabled).ToListAsync(stoppingToken);
            if (!rules.Any()) return;

            var reminderRule = rules.FirstOrDefault(r => r.Name == "Nhắc lịch đặt sân");
            if (reminderRule != null)
            {
                await ProcessBookingRemindersAsync(dbContext, reminderRule, stoppingToken);
            }
        }

        private async Task ProcessBookingRemindersAsync(AppDbContext dbContext, AutomationRule rule, CancellationToken stoppingToken)
        {
            var now = DateTime.UtcNow;
            var todayIso = now.ToString("yyyy-MM-dd");

            // Look for bookings today that are playing soon (e.g. within 2.5 hours)
            // Note: In real app, we'd need to parse StartTime properly and check exact diff.
            // For mock, we'll just randomly select one pending/confirmed booking that hasn't been notified today.
            
            // To prevent spamming, we check if we already sent a notification recently
            var recentNotifs = await dbContext.AppNotifications
                .Where(n => n.Title == rule.Name && n.CreatedAt.StartsWith(todayIso))
                .CountAsync(stoppingToken);

            if (recentNotifs > 0)
            {
                // Already sent today (since it's a mock, we limit to 1 per day to avoid spam)
                return;
            }

            var upcomingBooking = await dbContext.Bookings
                .Where(b => b.Date == todayIso && (b.Status == "pending" || b.Status == "confirmed"))
                .FirstOrDefaultAsync(stoppingToken);

            if (upcomingBooking != null)
            {
                var notification = new AppNotification
                {
                    Id = Guid.NewGuid(),
                    Channel = rule.Channel,
                    Title = rule.Name,
                    Message = $"Xin chào {upcomingBooking.CustomerName}, lịch đặt sân {upcomingBooking.CourtName} của bạn lúc {upcomingBooking.StartTime} hôm nay sắp diễn ra. Vui lòng có mặt đúng giờ nhé!",
                    Audience = upcomingBooking.CustomerName,
                    Recipients = 1,
                    Status = "sent",
                    CreatedAt = now.ToString("O"),
                    SentAt = now.ToString("O")
                };

                dbContext.AppNotifications.Add(notification);
                await dbContext.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Sent automated reminder to {Customer} for booking {Code}", upcomingBooking.CustomerName, upcomingBooking.Code);
            }
        }
    }
}

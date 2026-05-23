using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Data;
using ProjectA.Dtos.Analytics;
using System.Globalization;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Có thể thêm Policy nếu cần, ví dụ ReportView
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        private static string GetTodayIso() => DateTime.UtcNow.ToString("yyyy-MM-dd");

        [HttpGet("overview")]
        public async Task<ActionResult<AnalyticsOverviewDto>> GetOverview()
        {
            var today = GetTodayIso();

            // Bookings today
            var todaysBookings = await _context.Bookings
                .Where(b => b.Date == today && b.Status != "cancelled" && b.Status != "no-show")
                .ToListAsync();

            var revenueStatuses = new[] { "confirmed", "playing", "completed" };
            
            var bookingsToday = todaysBookings.Count;
            var playingNow = todaysBookings.Count(b => b.Status == "playing");
            var bookingRevenue = todaysBookings
                .Where(b => revenueStatuses.Contains(b.Status))
                .Sum(b => b.TotalPrice);

            // Orders today
            var todayDate = DateTime.SpecifyKind(DateTime.ParseExact(today, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal).Date, DateTimeKind.Utc);
            var tomorrowDate = todayDate.AddDays(1);
            
            var todaysOrders = await _context.Orders
                .Where(o => o.CreatedAt >= todayDate && o.CreatedAt < tomorrowDate)
                .ToListAsync();
            var orderRevenue = todaysOrders.Sum(o => o.Total);

            // Courts
            var courts = await _context.Courts.ToListAsync();
            var totalCourts = courts.Count;
            var operationalCourts = courts.Count(c => c.Status != "maintenance");

            // Tính % lấp đầy (occupancy) đơn giản dựa trên 19 slots (5h - 24h)
            var totalSlots = operationalCourts * 19;
            var bookedSlots = 0;
            foreach (var b in todaysBookings)
            {
                if (TimeSpan.TryParse(b.StartTime, out var st) && TimeSpan.TryParse(b.EndTime, out var et))
                {
                    bookedSlots += (int)(et.TotalHours - st.TotalHours);
                }
            }
            var occupancy = totalSlots > 0 ? Math.Round((decimal)bookedSlots * 100 / totalSlots, 1) : 0;

            // Free courts now
            var currentHour = DateTime.UtcNow.AddHours(7).TimeOfDay; // UTC+7
            var busyCourts = todaysBookings
                .Where(b => TimeSpan.TryParse(b.StartTime, out var st) && TimeSpan.TryParse(b.EndTime, out var et) && currentHour >= st && currentHour <= et)
                .Select(b => b.CourtName)
                .Distinct()
                .ToList();
            
            var freeCourtsNow = operationalCourts - busyCourts.Count;

            return new AnalyticsOverviewDto
            {
                RevenueToday = bookingRevenue + orderRevenue,
                BookingsToday = bookingsToday,
                PlayingNow = playingNow,
                TotalCourts = totalCourts,
                OperationalCourts = operationalCourts,
                FreeCourtsNow = Math.Max(0, freeCourtsNow),
                OccupancyToday = occupancy
            };
        }

        [HttpGet("reports")]
        public async Task<ActionResult<AnalyticsReportsDto>> GetReports([FromQuery] int days = 14)
        {
            var fromDate = DateTime.UtcNow.AddDays(-days).ToString("yyyy-MM-dd");

            var fromDateTime = DateTime.SpecifyKind(DateTime.ParseExact(fromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal).Date, DateTimeKind.Utc);

            var bookings = await _context.Bookings
                .Where(b => string.Compare(b.Date, fromDate) >= 0)
                .ToListAsync();

            var orders = await _context.Orders
                .Where(o => o.CreatedAt >= fromDateTime)
                .ToListAsync();

            var dto = new AnalyticsReportsDto();

            // 1. Trends & 2. Revenue
            var revenueStatuses = new[] { "confirmed", "playing", "completed" };
            for (int i = days - 1; i >= 0; i--)
            {
                var date = DateTime.UtcNow.AddDays(-i).ToString("yyyy-MM-dd");
                var dateObj = DateTime.SpecifyKind(DateTime.ParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal).Date, DateTimeKind.Utc);
                var nextDateObj = dateObj.AddDays(1);

                var bs = bookings.Where(b => b.Date == date).ToList();
                var os = orders.Where(o => o.CreatedAt >= dateObj && o.CreatedAt < nextDateObj).ToList();

                var bookRev = bs.Where(b => revenueStatuses.Contains(b.Status)).Sum(b => b.TotalPrice);
                var ordRev = os.Sum(o => o.Total);

                dto.Revenue.Add(new RevenueByDayDto
                {
                    Date = date.Substring(5).Replace("-", "/"), // MM/dd
                    Tiền_sân = bookRev,
                    Bán_hàng = ordRev
                });

                dto.Trends.Add(new BookingTrendDto
                {
                    Date = date.Substring(5).Replace("-", "/"),
                    Lượt_đặt = bs.Count(b => b.Status != "cancelled" && b.Status != "no-show"),
                    Hủy = bs.Count(b => b.Status == "cancelled")
                });
            }

            // 3. Peak Hours
            var hourDict = new Dictionary<string, int>();
            foreach (var b in bookings.Where(b => b.Status != "cancelled" && b.Status != "no-show"))
            {
                var h = b.StartTime.Substring(0, 2);
                if (!hourDict.ContainsKey(h)) hourDict[h] = 0;
                hourDict[h]++;
            }
            dto.Peak = hourDict.Select(kvp => new PeakHourDto { Hour = kvp.Key + ":00", Lượt_đặt = kvp.Value })
                               .OrderBy(p => p.Hour)
                               .ToList();

            // 4. Top Customers
            var custDict = new Dictionary<string, decimal>();
            foreach (var b in bookings.Where(b => revenueStatuses.Contains(b.Status)))
            {
                var name = string.IsNullOrWhiteSpace(b.CustomerName) ? "Khách lẻ" : b.CustomerName;
                if (!custDict.ContainsKey(name)) custDict[name] = 0;
                custDict[name] += b.TotalPrice;
            }
            foreach (var o in orders)
            {
                var name = string.IsNullOrWhiteSpace(o.CustomerName) ? "Khách lẻ" : o.CustomerName;
                if (!custDict.ContainsKey(name)) custDict[name] = 0;
                custDict[name] += o.Total;
            }
            dto.Tops = custDict.Select(kvp => new TopCustomerDto { Name = kvp.Key, Chi_tiêu = kvp.Value })
                               .OrderByDescending(t => t.Chi_tiêu)
                               .Take(5)
                               .ToList();

            // 5. Court Performance
            var courtDict = new Dictionary<string, decimal>();
            foreach (var b in bookings.Where(b => revenueStatuses.Contains(b.Status)))
            {
                var name = string.IsNullOrWhiteSpace(b.CourtName) ? "Sân ảo" : b.CourtName;
                if (!courtDict.ContainsKey(name)) courtDict[name] = 0;
                courtDict[name] += b.TotalPrice;
            }
            dto.Courts = courtDict.Select(kvp => new CourtPerformanceDto { Court = kvp.Key, Doanh_thu = kvp.Value })
                                  .OrderByDescending(c => c.Doanh_thu)
                                  .ToList();

            return dto;
        }
    }
}

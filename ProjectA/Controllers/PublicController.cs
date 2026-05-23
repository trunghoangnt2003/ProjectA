using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Data;
using ProjectA.Dtos.Public;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    /// <summary>
    /// Public endpoints (AllowAnonymous) cho trang đặt sân khách hàng.
    /// Không yêu cầu đăng nhập admin.
    /// </summary>
    [ApiController]
    [Route("api/public")]
    [AllowAnonymous]
    public class PublicController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public PublicController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // ── Courts ──────────────────────────────────────────────────

        [HttpGet("courts")]
        public async Task<ActionResult<IEnumerable<PublicCourtDto>>> GetCourts()
        {
            var courts = await _dbContext.Courts
                .AsNoTracking()
                .Where(c => c.Status != "maintenance")
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(courts.Select(ToPublicCourt));
        }

        [HttpGet("courts/{id:guid}")]
        public async Task<ActionResult<PublicCourtDto>> GetCourtById(Guid id)
        {
            var court = await _dbContext.Courts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (court is null) return NotFound();
            return Ok(ToPublicCourt(court));
        }

        // ── Bookings ────────────────────────────────────────────────

        [HttpGet("bookings")]
        public async Task<ActionResult<IEnumerable<PublicBookingDto>>> GetBookingsByDate([FromQuery] string? date)
        {
            var query = _dbContext.Bookings.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(date))
            {
                query = query.Where(b => b.Date == date);
            }

            var items = await query
                .OrderByDescending(b => b.Date)
                .ThenBy(b => b.StartTime)
                .ToListAsync();

            return Ok(items.Select(ToPublicBooking));
        }

        [HttpGet("bookings/search")]
        public async Task<ActionResult<IEnumerable<PublicBookingDto>>> SearchBookings([FromQuery] string? q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(Array.Empty<PublicBookingDto>());
            }

            var query = q.Trim().ToLower();
            var items = await _dbContext.Bookings
                .AsNoTracking()
                .Where(b =>
                    b.Code.ToLower().Contains(query) ||
                    b.CustomerPhone.Contains(query))
                .OrderByDescending(b => b.Date)
                .Take(20)
                .ToListAsync();

            return Ok(items.Select(ToPublicBooking));
        }

        [HttpGet("bookings/by-phone/{phone}")]
        public async Task<ActionResult<IEnumerable<PublicBookingDto>>> GetBookingsByPhone(string phone)
        {
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            var items = await _dbContext.Bookings
                .AsNoTracking()
                .Where(b => b.CustomerPhone.Contains(digits))
                .OrderByDescending(b => b.Date)
                .ToListAsync();

            return Ok(items.Select(ToPublicBooking));
        }

        [HttpPost("bookings")]
        public async Task<ActionResult<PublicBookingDto>> CreateBooking([FromBody] CreatePublicBookingRequest request)
        {
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                Code = "BK-" + Random.Shared.Next(1000, 9999),
                CustomerName = request.CustomerName,
                CustomerPhone = request.Phone,
                CourtName = request.CourtName,
                Date = request.Date,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Status = "pending",
                TotalPrice = request.TotalPrice,
            };

            _dbContext.Bookings.Add(booking);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBookingsByDate), new { date = booking.Date }, ToPublicBooking(booking));
        }

        [HttpPut("bookings/{id:guid}/cancel")]
        public async Task<ActionResult<PublicBookingDto>> CancelBooking(Guid id)
        {
            var booking = await _dbContext.Bookings.FirstOrDefaultAsync(b => b.Id == id);
            if (booking is null) return NotFound();

            if (booking.Status is not ("pending" or "confirmed"))
            {
                return BadRequest("Chỉ có thể hủy lượt đặt đang chờ xác nhận hoặc đã xác nhận.");
            }

            booking.Status = "cancelled";
            await _dbContext.SaveChangesAsync();

            return Ok(ToPublicBooking(booking));
        }

        // ── Products (extras) ───────────────────────────────────────

        [HttpGet("products")]
        public async Task<ActionResult<IEnumerable<PublicProductDto>>> GetProducts()
        {
            var products = await _dbContext.Products
                .AsNoTracking()
                .Where(p => p.Stock > 0)
                .OrderBy(p => p.Name)
                .Select(p => new PublicProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Category = p.Category,
                    Price = p.Price,
                })
                .ToListAsync();

            return Ok(products);
        }

        // ── Mapping ─────────────────────────────────────────────────

        private static PublicCourtDto ToPublicCourt(Court c) => new()
        {
            Id = c.Id,
            Name = c.Name,
            Zone = c.Zone,
            Type = c.Type,
            ImageUrl = c.ImageUrl,
            PriceSlots = c.PriceSlots.Select(s => new PublicPriceSlotDto
            {
                Start = s.Start,
                End = s.End,
                PricePerHour = s.PricePerHour,
            }).ToList(),
            WeekendSurcharge = c.WeekendSurcharge,
            HolidaySurcharge = c.HolidaySurcharge,
            MemberDiscount = c.MemberDiscount,
            Status = c.Status,
        };

        private static PublicBookingDto ToPublicBooking(Booking b) => new()
        {
            Id = b.Id,
            Code = b.Code,
            Date = b.Date,
            CourtName = b.CourtName,
            CustomerName = b.CustomerName,
            Phone = b.CustomerPhone,
            StartTime = b.StartTime,
            EndTime = b.EndTime,
            TotalPrice = b.TotalPrice,
            Status = b.Status,
        };
    }
}

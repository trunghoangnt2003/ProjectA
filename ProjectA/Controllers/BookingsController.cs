using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Booking;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public BookingsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.BookingView)]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetAll([FromQuery] string? date)
        {
            var query = _dbContext.Bookings.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(date))
            {
                query = query.Where(b => b.Date == date);
            }

            var items = await query.OrderByDescending(b => b.Date).ThenBy(b => b.StartTime).ToListAsync();
            return Ok(items.Select(ToDto));
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.BookingView)]
        public async Task<ActionResult<BookingDto>> GetById(Guid id)
        {
            var b = await _dbContext.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return b is null ? NotFound() : Ok(ToDto(b));
        }

        [HttpPost]
        [Authorize(Policy = Policies.BookingAdd)]
        public async Task<ActionResult<BookingDto>> Create([FromBody] CreateBookingRequest request)
        {
            var b = new Booking { Id = Guid.NewGuid(), Code = string.IsNullOrWhiteSpace(request.Code) ? GenerateCode() : request.Code };
            Apply(b, request);
            _dbContext.Bookings.Add(b);
            await _dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = b.Id }, ToDto(b));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.BookingEdit)]
        public async Task<ActionResult<BookingDto>> Update(Guid id, [FromBody] UpdateBookingRequest request)
        {
            var b = await _dbContext.Bookings.FirstOrDefaultAsync(x => x.Id == id);
            if (b is null) return NotFound();
            if (!string.IsNullOrWhiteSpace(request.Code)) b.Code = request.Code;
            Apply(b, request);
            await _dbContext.SaveChangesAsync();
            return Ok(ToDto(b));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.BookingDelete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var b = await _dbContext.Bookings.FirstOrDefaultAsync(x => x.Id == id);
            if (b is null) return NotFound();
            _dbContext.Bookings.Remove(b);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static string GenerateCode() => "BK-" + Random.Shared.Next(1000, 9999);

        private static void Apply(Booking b, CreateBookingRequest r)
        {
            b.CustomerName = r.CustomerName;
            b.CustomerPhone = r.CustomerPhone;
            b.CourtName = r.CourtName;
            b.Date = r.Date;
            b.StartTime = r.StartTime;
            b.EndTime = r.EndTime;
            b.Status = r.Status;
            b.TotalPrice = r.TotalPrice;
            b.CancelReason = r.CancelReason;
        }

        private static BookingDto ToDto(Booking b) => new()
        {
            Id = b.Id,
            Code = b.Code,
            CustomerName = b.CustomerName,
            CustomerPhone = b.CustomerPhone,
            CourtName = b.CourtName,
            Date = b.Date,
            StartTime = b.StartTime,
            EndTime = b.EndTime,
            Status = b.Status,
            TotalPrice = b.TotalPrice,
            CancelReason = b.CancelReason
        };
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
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
        public async Task<ActionResult<PagedResult<BookingDto>>> GetAll([FromQuery] ProjectA.Dtos.Common.QueryOptions opts)
        {
            var query = _dbContext.Bookings.AsNoTracking();

            // Bookings typically use string "Date" "yyyy-MM-dd" or "yyyy-mm-dd"
            if (opts.StartDate.HasValue)
            {
                var dStr = opts.StartDate.Value.ToString("yyyy-MM-dd");
                query = query.Where(b => b.Date.CompareTo(dStr) >= 0);
            }
            if (opts.EndDate.HasValue)
            {
                var dStr = opts.EndDate.Value.ToString("yyyy-MM-dd");
                query = query.Where(b => b.Date.CompareTo(dStr) <= 0);
            }

            // Optional search by customer name
            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var term = opts.Search.ToLower();
                query = query.Where(b => b.CustomerName.ToLower().Contains(term));
            }

            if (opts.SortBy == "date" || string.IsNullOrWhiteSpace(opts.SortBy))
            {
                query = opts.SortDesc 
                    ? query.OrderByDescending(b => b.Date).ThenByDescending(b => b.StartTime)
                    : query.OrderBy(b => b.Date).ThenBy(b => b.StartTime);
            }

            var total = await query.CountAsync();
            var items = await query
                .Skip((opts.Page - 1) * opts.PageSize)
                .Take(opts.PageSize)
                .Select(b => ToDto(b))
                .ToListAsync();

            return Ok(new PagedResult<BookingDto>
            {
                Items = items,
                TotalCount = total,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
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

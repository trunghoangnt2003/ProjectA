using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Court;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/courts")]
    public class CourtsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public CourtsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.CourtView)]
        public async Task<ActionResult<PagedResult<CourtDto>>> GetAll([FromQuery] QueryOptions opts)
        {
            var query = _dbContext.Courts.AsQueryable();

            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var term = opts.Search.ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(term));
            }

            query = opts.SortDesc ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name);

            var total = await query.CountAsync();

            var items = await query
                .Skip((opts.Page - 1) * opts.PageSize)
                .Take(opts.PageSize)
                .Select(c => ToDto(c))
                .ToListAsync();

            return Ok(new PagedResult<CourtDto>
            {
                Items = items,
                TotalCount = total,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.CourtView)]
        public async Task<ActionResult<CourtDto>> GetById(Guid id)
        {
            var court = await _dbContext.Courts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (court is null)
            {
                return NotFound();
            }

            return Ok(ToDto(court));
        }

        [HttpPost]
        [Authorize(Policy = Policies.CourtAdd)]
        public async Task<ActionResult<CourtDto>> Create([FromBody] CreateCourtRequest request)
        {
            var court = new Court
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Zone = request.Zone,
                Type = request.Type,
                ImageUrl = request.ImageUrl,
                PriceSlots = MapSlots(request.PriceSlots),
                WeekendSurcharge = request.WeekendSurcharge,
                HolidaySurcharge = request.HolidaySurcharge,
                MemberDiscount = request.MemberDiscount,
                Status = request.Status,
                Note = request.Note
            };

            _dbContext.Courts.Add(court);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = court.Id }, ToDto(court));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.CourtEdit)]
        public async Task<ActionResult<CourtDto>> Update(Guid id, [FromBody] UpdateCourtRequest request)
        {
            var court = await _dbContext.Courts.FirstOrDefaultAsync(c => c.Id == id);
            if (court is null)
            {
                return NotFound();
            }

            court.Name = request.Name;
            court.Zone = request.Zone;
            court.Type = request.Type;
            court.ImageUrl = request.ImageUrl;
            court.PriceSlots = MapSlots(request.PriceSlots);
            court.WeekendSurcharge = request.WeekendSurcharge;
            court.HolidaySurcharge = request.HolidaySurcharge;
            court.MemberDiscount = request.MemberDiscount;
            court.Status = request.Status;
            court.Note = request.Note;

            await _dbContext.SaveChangesAsync();

            return Ok(ToDto(court));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.CourtDelete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var court = await _dbContext.Courts.FirstOrDefaultAsync(c => c.Id == id);
            if (court is null)
            {
                return NotFound();
            }

            _dbContext.Courts.Remove(court);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static List<PriceSlot> MapSlots(IEnumerable<PriceSlotDto> slots) =>
            slots.Select(s => new PriceSlot
            {
                Start = s.Start,
                End = s.End,
                PricePerHour = s.PricePerHour
            }).ToList();

        private static CourtDto ToDto(Court c) => new()
        {
            Id = c.Id,
            Name = c.Name,
            Zone = c.Zone,
            Type = c.Type,
            ImageUrl = c.ImageUrl,
            PriceSlots = c.PriceSlots.Select(s => new PriceSlotDto
            {
                Start = s.Start,
                End = s.End,
                PricePerHour = s.PricePerHour
            }).ToList(),
            WeekendSurcharge = c.WeekendSurcharge,
            HolidaySurcharge = c.HolidaySurcharge,
            MemberDiscount = c.MemberDiscount,
            Status = c.Status,
            Note = c.Note
        };
    }
}

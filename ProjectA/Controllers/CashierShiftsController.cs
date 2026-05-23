using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.CashierShift;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CashierShiftsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CashierShiftsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<CashierShiftDto>>> GetCashierShifts([FromQuery] QueryOptions options)
        {
            var query = _context.CashierShifts.AsQueryable();

            if (!string.IsNullOrWhiteSpace(options.Search))
            {
                var search = options.Search.ToLower();
                query = query.Where(x => x.Cashier.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(options.SortBy))
            {
                query = options.SortBy.ToLower() switch
                {
                    "openedat" => options.SortDesc ? query.OrderByDescending(x => x.OpenedAt) : query.OrderBy(x => x.OpenedAt),
                    _ => options.SortDesc ? query.OrderByDescending(x => x.OpenedAt) : query.OrderBy(x => x.OpenedAt)
                };
            }
            else
            {
                query = query.OrderByDescending(x => x.OpenedAt);
            }

            var totalCount = await query.CountAsync();
            var items = await query.Skip((options.Page - 1) * options.PageSize).Take(options.PageSize).ToListAsync();

            var dtos = items.Select(c => new CashierShiftDto
            {
                Id = c.Id,
                Cashier = c.Cashier,
                OpenedAt = c.OpenedAt.ToString("o"),
                ClosedAt = c.ClosedAt?.ToString("o"),
                OpeningCash = c.OpeningCash,
                CountedCash = c.CountedCash,
                Status = c.Status,
                Note = c.Note
            }).ToList();

            return Ok(new PagedResult<CashierShiftDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpPost]
        public async Task<ActionResult<CashierShiftDto>> CreateCashierShift(CreateCashierShiftRequest request)
        {
            var c = new CashierShift
            {
                Cashier = request.Cashier,
                OpenedAt = DateTime.Parse(request.OpenedAt).ToUniversalTime(),
                ClosedAt = string.IsNullOrEmpty(request.ClosedAt) ? null : DateTime.Parse(request.ClosedAt).ToUniversalTime(),
                OpeningCash = request.OpeningCash,
                CountedCash = request.CountedCash,
                Status = request.Status,
                Note = request.Note
            };

            _context.CashierShifts.Add(c);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCashierShifts", new { id = c.Id }, null);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCashierShift(Guid id, UpdateCashierShiftRequest request)
        {
            var c = await _context.CashierShifts.FindAsync(id);
            if (c == null) return NotFound();

            c.Cashier = request.Cashier;
            c.OpenedAt = DateTime.Parse(request.OpenedAt).ToUniversalTime();
            c.ClosedAt = string.IsNullOrEmpty(request.ClosedAt) ? null : DateTime.Parse(request.ClosedAt).ToUniversalTime();
            c.OpeningCash = request.OpeningCash;
            c.CountedCash = request.CountedCash;
            c.Status = request.Status;
            c.Note = request.Note;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCashierShift(Guid id)
        {
            var c = await _context.CashierShifts.FindAsync(id);
            if (c == null) return NotFound();

            _context.CashierShifts.Remove(c);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

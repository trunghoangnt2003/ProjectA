using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Phase1;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/rentals")]
    public class RentalsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public RentalsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.RentalManage)]
        public async Task<ActionResult<PagedResult<RentalDto>>> GetAll([FromQuery] QueryOptions opts)
        {
            var query = _dbContext.Rentals.AsQueryable();

            if (opts.StartDate.HasValue)
            {
                query = query.Where(r => r.BorrowedAt >= opts.StartDate.Value);
            }
            if (opts.EndDate.HasValue)
            {
                query = query.Where(r => r.BorrowedAt <= opts.EndDate.Value);
            }
            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var term = opts.Search.ToLower();
                query = query.Where(r => r.CustomerName.ToLower().Contains(term) || r.Code.ToLower().Contains(term));
            }

            if (opts.SortBy == "date" || string.IsNullOrWhiteSpace(opts.SortBy))
            {
                query = opts.SortDesc ? query.OrderByDescending(x => x.BorrowedAt) : query.OrderBy(x => x.BorrowedAt);
            }
            else
            {
                query = opts.SortDesc ? query.OrderByDescending(x => x.BorrowedAt) : query.OrderBy(x => x.BorrowedAt);
            }

            var total = await query.CountAsync();

            var items = await query
                .Skip((opts.Page - 1) * opts.PageSize)
                .Take(opts.PageSize)
                .Select(r => ToDto(r))
                .ToListAsync();

            return Ok(new PagedResult<RentalDto>
            {
                Items = items,
                TotalCount = total,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.RentalManage)]
        public async Task<ActionResult<RentalDto>> GetById(Guid id)
        {
            var r = await _dbContext.Rentals.FirstOrDefaultAsync(x => x.Id == id);
            if (r is null) return NotFound();
            return Ok(ToDto(r));
        }

        [HttpPost]
        [Authorize(Policy = Policies.RentalManage)]
        public async Task<ActionResult<RentalDto>> Create([FromBody] CreateRentalRequest request)
        {
            var nextId = await _dbContext.Rentals.CountAsync() + 1;
            var r = new Rental
            {
                Id = Guid.NewGuid(),
                Code = $"TH-{nextId:D4}",
                ItemId = request.ItemId,
                ItemName = request.ItemName,
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                Quantity = request.Quantity,
                Fee = request.Fee,
                Deposit = request.Deposit,
                BorrowedAt = request.BorrowedAt.ToUniversalTime(),
                DueAt = request.DueAt?.ToUniversalTime(),
                Status = "borrowed",
                Note = request.Note
            };

            _dbContext.Rentals.Add(r);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = r.Id }, ToDto(r));
        }

        [HttpPut("{id:guid}/return")]
        [Authorize(Policy = Policies.RentalManage)]
        public async Task<ActionResult<RentalDto>> Return(Guid id)
        {
            var r = await _dbContext.Rentals.FirstOrDefaultAsync(x => x.Id == id);
            if (r is null) return NotFound();

            r.Status = "returned";
            r.ReturnedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return Ok(ToDto(r));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.RentalManage)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var r = await _dbContext.Rentals.FirstOrDefaultAsync(x => x.Id == id);
            if (r is null) return NotFound();

            _dbContext.Rentals.Remove(r);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static RentalDto ToDto(Rental r) => new()
        {
            Id = r.Id,
            Code = r.Code,
            ItemId = r.ItemId,
            ItemName = r.ItemName,
            CustomerName = r.CustomerName,
            CustomerPhone = r.CustomerPhone,
            Quantity = r.Quantity,
            Fee = r.Fee,
            Deposit = r.Deposit,
            BorrowedAt = r.BorrowedAt,
            DueAt = r.DueAt,
            ReturnedAt = r.ReturnedAt,
            Status = r.Status,
            Note = r.Note
        };
    }
}

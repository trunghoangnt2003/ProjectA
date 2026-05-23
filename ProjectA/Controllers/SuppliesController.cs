using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Supply;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/supplies")]
    public class SuppliesController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public SuppliesController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.SupplyView)]
        public async Task<ActionResult<PagedResult<SupplyDto>>> GetAll([FromQuery] QueryOptions opts)
        {
            var query = _dbContext.Supplies.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var s = opts.Search.ToLower();
                query = query.Where(x => x.Name.ToLower().Contains(s) || (x.Category != null && x.Category.ToLower().Contains(s)));
            }

            query = opts.SortBy?.ToLower() switch
            {
                "quantity" => opts.SortDesc ? query.OrderByDescending(x => x.Quantity) : query.OrderBy(x => x.Quantity),
                _ => opts.SortDesc ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name)
            };

            var totalCount = await query.CountAsync();
            var items = await query.Skip((opts.Page - 1) * opts.PageSize).Take(opts.PageSize)
                .Select(x => ToDto(x))
                .ToListAsync();

            return Ok(new PagedResult<SupplyDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.SupplyView)]
        public async Task<ActionResult<SupplyDto>> GetById(Guid id)
        {
            var s = await _dbContext.Supplies.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return s is null ? NotFound() : Ok(ToDto(s));
        }

        [HttpPost]
        [Authorize(Policy = Policies.SupplyAdd)]
        public async Task<ActionResult<SupplyDto>> Create([FromBody] CreateSupplyRequest request)
        {
            var s = new Supply { Id = Guid.NewGuid() };
            Apply(s, request);
            _dbContext.Supplies.Add(s);
            await _dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = s.Id }, ToDto(s));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.SupplyEdit)]
        public async Task<ActionResult<SupplyDto>> Update(Guid id, [FromBody] UpdateSupplyRequest request)
        {
            var s = await _dbContext.Supplies.FirstOrDefaultAsync(x => x.Id == id);
            if (s is null) return NotFound();
            Apply(s, request);
            await _dbContext.SaveChangesAsync();
            return Ok(ToDto(s));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.SupplyDelete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var s = await _dbContext.Supplies.FirstOrDefaultAsync(x => x.Id == id);
            if (s is null) return NotFound();
            _dbContext.Supplies.Remove(s);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static void Apply(Supply s, CreateSupplyRequest r)
        {
            s.Name = r.Name;
            s.Category = r.Category;
            s.Quantity = r.Quantity;
            s.Unit = r.Unit;
            s.ReorderLevel = r.ReorderLevel;
            s.ForSale = r.ForSale;
            s.SalePrice = r.ForSale ? r.SalePrice : null;
        }

        private static SupplyDto ToDto(Supply s) => new()
        {
            Id = s.Id,
            Name = s.Name,
            Category = s.Category,
            Quantity = s.Quantity,
            Unit = s.Unit,
            ReorderLevel = s.ReorderLevel,
            ForSale = s.ForSale,
            SalePrice = s.SalePrice
        };
    }
}

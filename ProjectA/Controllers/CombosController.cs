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
    [Route("api/combos")]
    public class CombosController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public CombosController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.ComboManage)]
        public async Task<ActionResult<PagedResult<ComboDto>>> GetAll([FromQuery] QueryOptions opts)
        {
            var query = _dbContext.Combos.Include(c => c.Lines).AsQueryable();

            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var term = opts.Search.ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(term));
            }

            // Since it doesn't have a date, we just sort by Name or Id
            if (opts.SortBy == "date" || opts.SortBy == "createdAt")
            {
                // no createdat for combos, fallback to id
                query = opts.SortDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id);
            }
            else
            {
                query = opts.SortDesc ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name);
            }

            var total = await query.CountAsync();

            var items = await query
                .Skip((opts.Page - 1) * opts.PageSize)
                .Take(opts.PageSize)
                .Select(c => ToDto(c))
                .ToListAsync();

            return Ok(new PagedResult<ComboDto>
            {
                Items = items,
                TotalCount = total,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.ComboManage)]
        public async Task<ActionResult<ComboDto>> GetById(Guid id)
        {
            var c = await _dbContext.Combos.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id);
            if (c is null) return NotFound();
            return Ok(ToDto(c));
        }

        [HttpPost]
        [Authorize(Policy = Policies.ComboManage)]
        public async Task<ActionResult<ComboDto>> Create([FromBody] CreateComboRequest request)
        {
            var combo = new Combo
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                Active = request.Active,
                Lines = request.Lines.Select(l => new ComboLine
                {
                    Id = Guid.NewGuid(),
                    RefId = l.RefId,
                    Source = l.Source,
                    Name = l.Name,
                    Quantity = l.Quantity
                }).ToList()
            };

            _dbContext.Combos.Add(combo);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = combo.Id }, ToDto(combo));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.ComboManage)]
        public async Task<ActionResult<ComboDto>> Update(Guid id, [FromBody] CreateComboRequest request)
        {
            var combo = await _dbContext.Combos.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id);
            if (combo is null) return NotFound();

            combo.Name = request.Name;
            combo.Description = request.Description;
            combo.Price = request.Price;
            combo.Active = request.Active;

            _dbContext.ComboLines.RemoveRange(combo.Lines);
            combo.Lines = request.Lines.Select(l => new ComboLine
            {
                Id = Guid.NewGuid(),
                ComboId = combo.Id,
                RefId = l.RefId,
                Source = l.Source,
                Name = l.Name,
                Quantity = l.Quantity
            }).ToList();

            await _dbContext.SaveChangesAsync();

            return Ok(ToDto(combo));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.ComboManage)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var combo = await _dbContext.Combos.FirstOrDefaultAsync(x => x.Id == id);
            if (combo is null) return NotFound();

            _dbContext.Combos.Remove(combo);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static ComboDto ToDto(Combo c) => new()
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Price = c.Price,
            Active = c.Active,
            Lines = c.Lines.Select(l => new ComboLineDto
            {
                RefId = l.RefId,
                Source = l.Source,
                Name = l.Name,
                Quantity = l.Quantity
            }).ToList()
        };
    }
}

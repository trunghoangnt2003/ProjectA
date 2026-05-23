using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Promotion;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PromotionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PromotionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.PromotionManage)]
        public async Task<ActionResult<PagedResult<PromotionDto>>> GetPromotions([FromQuery] QueryOptions options)
        {
            var query = _context.Promotions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(options.Search))
            {
                var search = options.Search.ToLower();
                query = query.Where(x => x.Code.ToLower().Contains(search) || x.Name.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(options.SortBy))
            {
                query = options.SortBy.ToLower() switch
                {
                    "code" => options.SortDesc ? query.OrderByDescending(x => x.Code) : query.OrderBy(x => x.Code),
                    _ => options.SortDesc ? query.OrderByDescending(x => x.Code) : query.OrderBy(x => x.Code)
                };
            }
            else
            {
                query = query.OrderBy(x => x.Code);
            }

            var totalCount = await query.CountAsync();
            var items = await query.Skip((options.Page - 1) * options.PageSize).Take(options.PageSize).ToListAsync();

            var dtos = items.Select(p => new PromotionDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Type = p.Type,
                Value = p.Value,
                Description = p.Description,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                TimeStart = p.TimeStart,
                TimeEnd = p.TimeEnd,
                MinOrder = p.MinOrder,
                MaxUses = p.MaxUses,
                UsedCount = p.UsedCount,
                Active = p.Active
            }).ToList();

            return Ok(new PagedResult<PromotionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.PromotionManage)]
        public async Task<ActionResult<PromotionDto>> CreatePromotion(CreatePromotionRequest request)
        {
            var p = new Promotion
            {
                Code = request.Code,
                Name = request.Name,
                Type = request.Type,
                Value = request.Value,
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TimeStart = request.TimeStart,
                TimeEnd = request.TimeEnd,
                MinOrder = request.MinOrder,
                MaxUses = request.MaxUses,
                Active = request.Active
            };

            _context.Promotions.Add(p);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPromotions", new { id = p.Id }, null);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.PromotionManage)]
        public async Task<IActionResult> UpdatePromotion(Guid id, UpdatePromotionRequest request)
        {
            var p = await _context.Promotions.FindAsync(id);
            if (p == null) return NotFound();

            p.Code = request.Code;
            p.Name = request.Name;
            p.Type = request.Type;
            p.Value = request.Value;
            p.Description = request.Description;
            p.StartDate = request.StartDate;
            p.EndDate = request.EndDate;
            p.TimeStart = request.TimeStart;
            p.TimeEnd = request.TimeEnd;
            p.MinOrder = request.MinOrder;
            p.MaxUses = request.MaxUses;
            p.Active = request.Active;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.PromotionManage)]
        public async Task<IActionResult> DeletePromotion(Guid id)
        {
            var p = await _context.Promotions.FindAsync(id);
            if (p == null) return NotFound();

            _context.Promotions.Remove(p);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

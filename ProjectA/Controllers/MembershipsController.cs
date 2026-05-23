using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Membership;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MembershipsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MembershipsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.MembershipManage)]
        public async Task<ActionResult<PagedResult<MembershipPlanDto>>> GetMembershipPlans([FromQuery] QueryOptions options)
        {
            var query = _context.MembershipPlans.AsQueryable();

            if (!string.IsNullOrWhiteSpace(options.Search))
            {
                var search = options.Search.ToLower();
                query = query.Where(x => x.Name.ToLower().Contains(search) || x.Level.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();
            var items = await query.Skip((options.Page - 1) * options.PageSize).Take(options.PageSize).ToListAsync();

            var dtos = items.Select(m => new MembershipPlanDto
            {
                Id = m.Id,
                Level = m.Level,
                Name = m.Name,
                Price = m.Price,
                DurationDays = m.DurationDays,
                DiscountPercent = m.DiscountPercent,
                Benefits = m.Benefits,
                Active = m.Active
            }).ToList();

            return Ok(new PagedResult<MembershipPlanDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.MembershipManage)]
        public async Task<ActionResult<MembershipPlanDto>> CreateMembershipPlan(CreateMembershipPlanRequest request)
        {
            var m = new MembershipPlan
            {
                Level = request.Level,
                Name = request.Name,
                Price = request.Price,
                DurationDays = request.DurationDays,
                DiscountPercent = request.DiscountPercent,
                Benefits = request.Benefits,
                Active = request.Active
            };

            _context.MembershipPlans.Add(m);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetMembershipPlans", new { id = m.Id }, null);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.MembershipManage)]
        public async Task<IActionResult> UpdateMembershipPlan(Guid id, UpdateMembershipPlanRequest request)
        {
            var m = await _context.MembershipPlans.FindAsync(id);
            if (m == null) return NotFound();

            m.Level = request.Level;
            m.Name = request.Name;
            m.Price = request.Price;
            m.DurationDays = request.DurationDays;
            m.DiscountPercent = request.DiscountPercent;
            m.Benefits = request.Benefits;
            m.Active = request.Active;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.MembershipManage)]
        public async Task<IActionResult> DeleteMembershipPlan(Guid id)
        {
            var m = await _context.MembershipPlans.FindAsync(id);
            if (m == null) return NotFound();

            _context.MembershipPlans.Remove(m);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

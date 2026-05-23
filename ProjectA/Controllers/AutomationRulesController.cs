using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Notification;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AutomationRulesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AutomationRulesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.NotificationManage)]
        public async Task<ActionResult<PagedResult<AutomationRuleDto>>> GetAutomationRules([FromQuery] QueryOptions options)
        {
            var query = _context.AutomationRules.AsQueryable();

            var totalCount = await query.CountAsync();
            var items = await query.Skip((options.Page - 1) * options.PageSize).Take(options.PageSize).ToListAsync();

            var dtos = items.Select(r => new AutomationRuleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                Channel = r.Channel,
                Enabled = r.Enabled
            }).ToList();

            return Ok(new PagedResult<AutomationRuleDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.NotificationManage)]
        public async Task<IActionResult> UpdateAutomationRule(Guid id, UpdateAutomationRuleRequest request)
        {
            var r = await _context.AutomationRules.FindAsync(id);
            if (r == null) return NotFound();

            r.Name = request.Name;
            r.Description = request.Description;
            r.Channel = request.Channel;
            r.Enabled = request.Enabled;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

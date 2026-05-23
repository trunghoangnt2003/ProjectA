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
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.NotificationManage)]
        public async Task<ActionResult<PagedResult<AppNotificationDto>>> GetNotifications([FromQuery] QueryOptions options)
        {
            var query = _context.AppNotifications.AsQueryable();

            if (!string.IsNullOrWhiteSpace(options.Search))
            {
                var search = options.Search.ToLower();
                query = query.Where(x => x.Title.ToLower().Contains(search) || x.Message.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(x => x.CreatedAt)
                                 .Skip((options.Page - 1) * options.PageSize)
                                 .Take(options.PageSize)
                                 .ToListAsync();

            var dtos = items.Select(n => new AppNotificationDto
            {
                Id = n.Id,
                Channel = n.Channel,
                Title = n.Title,
                Message = n.Message,
                Audience = n.Audience,
                Recipients = n.Recipients,
                Status = n.Status,
                CreatedAt = n.CreatedAt,
                SentAt = n.SentAt
            }).ToList();

            return Ok(new PagedResult<AppNotificationDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.NotificationManage)]
        public async Task<ActionResult<AppNotificationDto>> CreateNotification(CreateAppNotificationRequest request)
        {
            var n = new AppNotification
            {
                Channel = request.Channel,
                Title = request.Title,
                Message = request.Message,
                Audience = request.Audience,
                Recipients = request.Recipients,
                Status = request.Status,
                CreatedAt = request.CreatedAt,
                SentAt = request.SentAt
            };

            _context.AppNotifications.Add(n);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetNotifications", new { id = n.Id }, null);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.NotificationManage)]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            var n = await _context.AppNotifications.FindAsync(id);
            if (n == null) return NotFound();

            _context.AppNotifications.Remove(n);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

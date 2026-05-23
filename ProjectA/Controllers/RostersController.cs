using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Roster;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RostersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RostersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.RosterManage)]
        public async Task<ActionResult<PagedResult<ShiftAssignmentDto>>> GetShiftAssignments([FromQuery] QueryOptions options)
        {
            var query = _context.ShiftAssignments.AsQueryable();

            if (!string.IsNullOrWhiteSpace(options.Search))
            {
                var search = options.Search.ToLower();
                query = query.Where(x => x.EmployeeName.ToLower().Contains(search) || x.Date.ToString().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(options.SortBy))
            {
                query = options.SortBy.ToLower() switch
                {
                    "date" => options.SortDesc ? query.OrderByDescending(x => x.Date) : query.OrderBy(x => x.Date),
                    _ => options.SortDesc ? query.OrderByDescending(x => x.Date) : query.OrderBy(x => x.Date)
                };
            }
            else
            {
                query = query.OrderByDescending(x => x.Date);
            }

            var totalCount = await query.CountAsync();
            var items = await query.Skip((options.Page - 1) * options.PageSize).Take(options.PageSize).ToListAsync();

            var dtos = items.Select(r => new ShiftAssignmentDto
            {
                Id = r.Id,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.EmployeeName,
                Date = r.Date.ToString("yyyy-MM-dd"),
                Shift = r.Shift
            }).ToList();

            return Ok(new PagedResult<ShiftAssignmentDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.RosterManage)]
        public async Task<ActionResult<ShiftAssignmentDto>> CreateShiftAssignment(CreateShiftAssignmentRequest request)
        {
            var date = DateTime.Parse(request.Date);
            var r = new ShiftAssignment
            {
                EmployeeId = request.EmployeeId,
                EmployeeName = request.EmployeeName,
                Date = date.ToUniversalTime(),
                Shift = request.Shift
            };

            _context.ShiftAssignments.Add(r);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetShiftAssignments", new { id = r.Id }, null);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.RosterManage)]
        public async Task<IActionResult> UpdateShiftAssignment(Guid id, UpdateShiftAssignmentRequest request)
        {
            var r = await _context.ShiftAssignments.FindAsync(id);
            if (r == null) return NotFound();

            var date = DateTime.Parse(request.Date);
            r.EmployeeId = request.EmployeeId;
            r.EmployeeName = request.EmployeeName;
            r.Date = date.ToUniversalTime();
            r.Shift = request.Shift;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.RosterManage)]
        public async Task<IActionResult> DeleteShiftAssignment(Guid id)
        {
            var r = await _context.ShiftAssignments.FindAsync(id);
            if (r == null) return NotFound();

            _context.ShiftAssignments.Remove(r);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

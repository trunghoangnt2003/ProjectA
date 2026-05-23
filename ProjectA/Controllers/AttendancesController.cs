using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Attendance;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttendancesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendancesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.AttendanceManage)]
        public async Task<ActionResult<PagedResult<AttendanceDto>>> GetAttendances([FromQuery] QueryOptions options)
        {
            var query = _context.Attendances.AsQueryable();

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

            var dtos = items.Select(a => new AttendanceDto
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.EmployeeName,
                Date = a.Date.ToString("yyyy-MM-dd"),
                Shift = a.Shift,
                Status = a.Status,
                CheckIn = a.CheckIn?.ToString(@"hh\:mm"),
                CheckOut = a.CheckOut?.ToString(@"hh\:mm")
            }).ToList();

            return Ok(new PagedResult<AttendanceDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.AttendanceManage)]
        public async Task<ActionResult<AttendanceDto>> CreateAttendance(CreateAttendanceRequest request)
        {
            var date = DateTime.Parse(request.Date);
            var a = new Attendance
            {
                EmployeeId = request.EmployeeId,
                EmployeeName = request.EmployeeName,
                Date = date.ToUniversalTime(),
                Shift = request.Shift,
                Status = request.Status,
                CheckIn = string.IsNullOrEmpty(request.CheckIn) ? null : TimeSpan.Parse(request.CheckIn),
                CheckOut = string.IsNullOrEmpty(request.CheckOut) ? null : TimeSpan.Parse(request.CheckOut)
            };

            _context.Attendances.Add(a);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetAttendances", new { id = a.Id }, null);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.AttendanceManage)]
        public async Task<IActionResult> UpdateAttendance(Guid id, UpdateAttendanceRequest request)
        {
            var a = await _context.Attendances.FindAsync(id);
            if (a == null) return NotFound();

            var date = DateTime.Parse(request.Date);
            a.EmployeeId = request.EmployeeId;
            a.EmployeeName = request.EmployeeName;
            a.Date = date.ToUniversalTime();
            a.Shift = request.Shift;
            a.Status = request.Status;
            a.CheckIn = string.IsNullOrEmpty(request.CheckIn) ? null : TimeSpan.Parse(request.CheckIn);
            a.CheckOut = string.IsNullOrEmpty(request.CheckOut) ? null : TimeSpan.Parse(request.CheckOut);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.AttendanceManage)]
        public async Task<IActionResult> DeleteAttendance(Guid id)
        {
            var a = await _context.Attendances.FindAsync(id);
            if (a == null) return NotFound();

            _context.Attendances.Remove(a);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

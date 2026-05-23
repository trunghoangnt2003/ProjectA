using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Employee;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.EmployeeManage)]
        public async Task<ActionResult<PagedResult<EmployeeDto>>> GetEmployees([FromQuery] QueryOptions options)
        {
            var query = _context.Employees.AsQueryable();

            if (!string.IsNullOrWhiteSpace(options.Search))
            {
                var search = options.Search.ToLower();
                query = query.Where(x => x.Name.ToLower().Contains(search) || x.Phone.Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(options.SortBy))
            {
                query = options.SortBy.ToLower() switch
                {
                    "name" => options.SortDesc ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name),
                    "joinedat" => options.SortDesc ? query.OrderByDescending(x => x.JoinedAt) : query.OrderBy(x => x.JoinedAt),
                    _ => options.SortDesc ? query.OrderByDescending(x => x.JoinedAt) : query.OrderBy(x => x.JoinedAt)
                };
            }
            else
            {
                query = query.OrderByDescending(x => x.JoinedAt);
            }

            var totalCount = await query.CountAsync();
            var items = await query.Skip((options.Page - 1) * options.PageSize).Take(options.PageSize).ToListAsync();

            var dtos = items.Select(e => new EmployeeDto
            {
                Id = e.Id,
                Name = e.Name,
                Position = e.Position,
                Phone = e.Phone,
                Shift = e.Shift,
                Status = e.Status,
                JoinedAt = e.JoinedAt,
                ShiftRate = e.ShiftRate
            }).ToList();

            return Ok(new PagedResult<EmployeeDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = options.Page,
                PageSize = options.PageSize
            });
        }

        [HttpGet("{id}")]
        [Authorize(Policy = Policies.EmployeeManage)]
        public async Task<ActionResult<EmployeeDto>> GetEmployee(Guid id)
        {
            var e = await _context.Employees.FindAsync(id);
            if (e == null) return NotFound();

            return Ok(new EmployeeDto
            {
                Id = e.Id,
                Name = e.Name,
                Position = e.Position,
                Phone = e.Phone,
                Shift = e.Shift,
                Status = e.Status,
                JoinedAt = e.JoinedAt,
                ShiftRate = e.ShiftRate
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.EmployeeManage)]
        public async Task<ActionResult<EmployeeDto>> CreateEmployee(CreateEmployeeRequest request)
        {
            var e = new Employee
            {
                Name = request.Name,
                Position = request.Position,
                Phone = request.Phone,
                Shift = request.Shift,
                Status = request.Status,
                JoinedAt = request.JoinedAt,
                ShiftRate = request.ShiftRate
            };

            _context.Employees.Add(e);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEmployee), new { id = e.Id }, new EmployeeDto
            {
                Id = e.Id,
                Name = e.Name,
                Position = e.Position,
                Phone = e.Phone,
                Shift = e.Shift,
                Status = e.Status,
                JoinedAt = e.JoinedAt,
                ShiftRate = e.ShiftRate
            });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.EmployeeManage)]
        public async Task<IActionResult> UpdateEmployee(Guid id, UpdateEmployeeRequest request)
        {
            var e = await _context.Employees.FindAsync(id);
            if (e == null) return NotFound();

            e.Name = request.Name;
            e.Position = request.Position;
            e.Phone = request.Phone;
            e.Shift = request.Shift;
            e.Status = request.Status;
            e.JoinedAt = request.JoinedAt;
            e.ShiftRate = request.ShiftRate;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.EmployeeManage)]
        public async Task<IActionResult> DeleteEmployee(Guid id)
        {
            var e = await _context.Employees.FindAsync(id);
            if (e == null) return NotFound();

            _context.Employees.Remove(e);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

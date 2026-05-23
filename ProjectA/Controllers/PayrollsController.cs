using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Payroll;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PayrollsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PayrollsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Policies.PayrollView)]
        public async Task<ActionResult<IEnumerable<PayrollRowDto>>> GetPayroll([FromQuery] string month)
        {
            if (string.IsNullOrWhiteSpace(month))
            {
                month = DateTime.UtcNow.ToString("yyyy-MM");
            }

            var startDate = DateTime.Parse($"{month}-01").ToUniversalTime();
            var endDate = startDate.AddMonths(1);

            var employees = await _context.Employees.Where(e => e.Status == "active").ToListAsync();
            var attendances = await _context.Attendances
                .Where(a => a.Date >= startDate && a.Date < endDate)
                .ToListAsync();

            var rows = employees.Select(e =>
            {
                var recs = attendances.Where(a => a.EmployeeId == e.Id).ToList();
                var present = recs.Count(r => r.Status == "present");
                var late = recs.Count(r => r.Status == "late");
                var absent = recs.Count(r => r.Status == "absent");
                var worked = present + late;
                var total = present + late + absent;

                return new PayrollRowDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Position = e.Position,
                    Worked = worked,
                    Absent = absent,
                    OnTime = total > 0 ? (int)Math.Round((present / (double)total) * 100) : 0,
                    ShiftRate = e.ShiftRate,
                    Salary = worked * e.ShiftRate
                };
            }).ToList();

            return Ok(rows);
        }
    }
}

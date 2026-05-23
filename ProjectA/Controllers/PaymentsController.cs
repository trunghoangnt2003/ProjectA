using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Payment;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public PaymentsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.PaymentView)]
        public async Task<ActionResult<ProjectA.Dtos.Common.PagedResult<PaymentDto>>> GetAll([FromQuery] ProjectA.Dtos.Common.QueryOptions opts)
        {
            var query = _dbContext.Payments.AsNoTracking();

            if (opts.StartDate.HasValue)
            {
                query = query.Where(p => p.CreatedAt >= opts.StartDate.Value);
            }
            if (opts.EndDate.HasValue)
            {
                query = query.Where(p => p.CreatedAt <= opts.EndDate.Value);
            }
            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var term = opts.Search.ToLower();
                query = query.Where(p => (p.CustomerName != null && p.CustomerName.ToLower().Contains(term)) || p.Code.ToLower().Contains(term));
            }

            if (opts.SortBy == "date" || string.IsNullOrWhiteSpace(opts.SortBy))
            {
                query = opts.SortDesc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt);
            }

            var total = await query.CountAsync();
            var items = await query
                .Skip((opts.Page - 1) * opts.PageSize)
                .Take(opts.PageSize)
                .Select(p => ToDto(p))
                .ToListAsync();

            return Ok(new ProjectA.Dtos.Common.PagedResult<PaymentDto>
            {
                Items = items,
                TotalCount = total,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.PaymentView)]
        public async Task<ActionResult<PaymentDto>> GetById(Guid id)
        {
            var p = await _dbContext.Payments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return p is null ? NotFound() : Ok(ToDto(p));
        }

        [HttpPost]
        [Authorize(Policy = Policies.PaymentAdd)]
        public async Task<ActionResult<PaymentDto>> Create([FromBody] CreatePaymentRequest request)
        {
            var p = new Payment { Id = Guid.NewGuid(), Code = string.IsNullOrWhiteSpace(request.Code) ? "PT-" + Random.Shared.Next(1000, 9999) : request.Code };
            Apply(p, request);
            p.CreatedAt = request.CreatedAt ?? DateTime.UtcNow;
            _dbContext.Payments.Add(p);
            await _dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = p.Id }, ToDto(p));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.PaymentEdit)]
        public async Task<ActionResult<PaymentDto>> Update(Guid id, [FromBody] UpdatePaymentRequest request)
        {
            var p = await _dbContext.Payments.FirstOrDefaultAsync(x => x.Id == id);
            if (p is null) return NotFound();
            Apply(p, request);
            await _dbContext.SaveChangesAsync();
            return Ok(ToDto(p));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.PaymentDelete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var p = await _dbContext.Payments.FirstOrDefaultAsync(x => x.Id == id);
            if (p is null) return NotFound();
            _dbContext.Payments.Remove(p);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static void Apply(Payment p, CreatePaymentRequest r)
        {
            p.Source = r.Source;
            p.RefId = r.RefId;
            p.RefCode = r.RefCode;
            p.CustomerName = r.CustomerName;
            p.Amount = r.Amount;
            p.Method = r.Method;
            p.Status = r.Status;
            p.PaidAt = r.PaidAt;
            p.Note = r.Note;
        }

        private static PaymentDto ToDto(Payment p) => new()
        {
            Id = p.Id,
            Code = p.Code,
            Source = p.Source,
            RefId = p.RefId,
            RefCode = p.RefCode,
            CustomerName = p.CustomerName,
            Amount = p.Amount,
            Method = p.Method,
            Status = p.Status,
            CreatedAt = p.CreatedAt,
            PaidAt = p.PaidAt,
            Note = p.Note
        };
    }
}

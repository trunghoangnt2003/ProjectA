using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Customer;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/customers")]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public CustomersController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.CustomerView)]
        public async Task<ActionResult<PagedResult<CustomerDto>>> GetAll([FromQuery] QueryOptions opts)
        {
            var query = _dbContext.Customers.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var s = opts.Search.ToLower();
                query = query.Where(x => x.Name.ToLower().Contains(s) || x.Phone.Contains(s) || (x.Email != null && x.Email.ToLower().Contains(s)));
            }

            query = opts.SortBy?.ToLower() switch
            {
                "loyaltypoints" => opts.SortDesc ? query.OrderByDescending(x => x.LoyaltyPoints) : query.OrderBy(x => x.LoyaltyPoints),
                "totalbookings" => opts.SortDesc ? query.OrderByDescending(x => x.TotalBookings) : query.OrderBy(x => x.TotalBookings),
                "debt" => opts.SortDesc ? query.OrderByDescending(x => x.Debt) : query.OrderBy(x => x.Debt),
                "joinedat" => opts.SortDesc ? query.OrderByDescending(x => x.JoinedAt) : query.OrderBy(x => x.JoinedAt),
                _ => opts.SortDesc ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name)
            };

            var totalCount = await query.CountAsync();
            var items = await query.Skip((opts.Page - 1) * opts.PageSize).Take(opts.PageSize)
                .Select(x => ToDto(x))
                .ToListAsync();

            return Ok(new PagedResult<CustomerDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.CustomerView)]
        public async Task<ActionResult<CustomerDto>> GetById(Guid id)
        {
            var c = await _dbContext.Customers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return c is null ? NotFound() : Ok(ToDto(c));
        }

        [HttpPost]
        [Authorize(Policy = Policies.CustomerAdd)]
        public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerRequest request)
        {
            var c = new Customer { Id = Guid.NewGuid() };
            Apply(c, request);
            _dbContext.Customers.Add(c);
            await _dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = c.Id }, ToDto(c));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.CustomerEdit)]
        public async Task<ActionResult<CustomerDto>> Update(Guid id, [FromBody] UpdateCustomerRequest request)
        {
            var c = await _dbContext.Customers.FirstOrDefaultAsync(x => x.Id == id);
            if (c is null) return NotFound();
            Apply(c, request);
            await _dbContext.SaveChangesAsync();
            return Ok(ToDto(c));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.CustomerDelete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var c = await _dbContext.Customers.FirstOrDefaultAsync(x => x.Id == id);
            if (c is null) return NotFound();
            _dbContext.Customers.Remove(c);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static void Apply(Customer c, CreateCustomerRequest r)
        {
            c.Name = r.Name;
            c.Phone = r.Phone;
            c.Email = r.Email;
            c.Tags = r.Tags;
            c.LoyaltyPoints = r.LoyaltyPoints;
            c.Debt = r.Debt;
            c.Note = r.Note;
            c.Locked = r.Locked;
            c.TotalBookings = r.TotalBookings;
            c.JoinedAt = r.JoinedAt;
        }

        private static CustomerDto ToDto(Customer c) => new()
        {
            Id = c.Id,
            Name = c.Name,
            Phone = c.Phone,
            Email = c.Email,
            Tags = c.Tags,
            LoyaltyPoints = c.LoyaltyPoints,
            Debt = c.Debt,
            Note = c.Note,
            Locked = c.Locked,
            TotalBookings = c.TotalBookings,
            JoinedAt = c.JoinedAt
        };
    }
}

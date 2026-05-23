using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Order;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/orders")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public OrdersController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.OrderView)]
        public async Task<ActionResult<ProjectA.Dtos.Common.PagedResult<OrderDto>>> GetAll([FromQuery] ProjectA.Dtos.Common.QueryOptions opts)
        {
            var query = _dbContext.Orders.AsNoTracking();

            if (opts.StartDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= opts.StartDate.Value);
            }
            if (opts.EndDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt <= opts.EndDate.Value);
            }
            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var term = opts.Search.ToLower();
                query = query.Where(o => (o.CustomerName != null && o.CustomerName.ToLower().Contains(term)) || o.Code.ToLower().Contains(term));
            }

            if (opts.SortBy == "date" || string.IsNullOrWhiteSpace(opts.SortBy))
            {
                query = opts.SortDesc ? query.OrderByDescending(o => o.CreatedAt) : query.OrderBy(o => o.CreatedAt);
            }

            var total = await query.CountAsync();
            var items = await query
                .Skip((opts.Page - 1) * opts.PageSize)
                .Take(opts.PageSize)
                .Select(o => ToDto(o))
                .ToListAsync();

            return Ok(new ProjectA.Dtos.Common.PagedResult<OrderDto>
            {
                Items = items,
                TotalCount = total,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.OrderView)]
        public async Task<ActionResult<OrderDto>> GetById(Guid id)
        {
            var o = await _dbContext.Orders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return o is null ? NotFound() : Ok(ToDto(o));
        }

        [HttpPost]
        [Authorize(Policy = Policies.OrderAdd)]
        public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderRequest request)
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                Code = string.IsNullOrWhiteSpace(request.Code) ? "HD-" + Random.Shared.Next(1000, 9999) : request.Code,
                CreatedAt = request.CreatedAt ?? DateTime.UtcNow,
                CustomerName = request.CustomerName,
                CourtName = request.CourtName,
                Lines = request.Lines.Select(l => new OrderLine
                {
                    RefId = l.RefId,
                    Source = l.Source,
                    Name = l.Name,
                    UnitPrice = l.UnitPrice,
                    Quantity = l.Quantity
                }).ToList(),
                Total = request.Total
            };

            _dbContext.Orders.Add(order);
            await _dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToDto(order));
        }

        private static OrderDto ToDto(Order o) => new()
        {
            Id = o.Id,
            Code = o.Code,
            CreatedAt = o.CreatedAt,
            CustomerName = o.CustomerName,
            CourtName = o.CourtName,
            Lines = o.Lines.Select(l => new OrderLineDto
            {
                RefId = l.RefId,
                Source = l.Source,
                Name = l.Name,
                UnitPrice = l.UnitPrice,
                Quantity = l.Quantity
            }).ToList(),
            Total = o.Total
        };
    }
}

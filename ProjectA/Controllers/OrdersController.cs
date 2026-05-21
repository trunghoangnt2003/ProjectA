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
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
        {
            var items = await _dbContext.Orders.AsNoTracking().OrderByDescending(o => o.CreatedAt).ToListAsync();
            return Ok(items.Select(ToDto));
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

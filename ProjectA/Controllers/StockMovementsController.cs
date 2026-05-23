using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Phase1;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/stock-movements")]
    public class StockMovementsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public StockMovementsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.InventoryManage)]
        public async Task<ActionResult<PagedResult<StockMovementDto>>> GetAll([FromQuery] QueryOptions opts)
        {
            var query = _dbContext.StockMovements.AsQueryable();

            if (opts.StartDate.HasValue)
            {
                query = query.Where(sm => sm.CreatedAt >= opts.StartDate.Value);
            }
            if (opts.EndDate.HasValue)
            {
                query = query.Where(sm => sm.CreatedAt <= opts.EndDate.Value);
            }
            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var term = opts.Search.ToLower();
                query = query.Where(sm => sm.ItemName.ToLower().Contains(term) || sm.Type.ToLower().Contains(term));
            }

            if (opts.SortBy == "date" || string.IsNullOrWhiteSpace(opts.SortBy))
            {
                query = opts.SortDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt);
            }
            else
            {
                query = opts.SortDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt);
            }

            var total = await query.CountAsync();

            var items = await query
                .Skip((opts.Page - 1) * opts.PageSize)
                .Take(opts.PageSize)
                .Select(sm => ToDto(sm))
                .ToListAsync();

            return Ok(new PagedResult<StockMovementDto>
            {
                Items = items,
                TotalCount = total,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpPost]
        [Authorize(Policy = Policies.InventoryManage)]
        public async Task<ActionResult<StockMovementDto>> Create([FromBody] CreateStockMovementRequest request)
        {
            // Update actual stock
            var balanceAfter = 0;
            if (request.ItemSource == "product")
            {
                var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == request.ItemId);
                if (product != null)
                {
                    if (request.Type == "in") product.Stock += request.Quantity;
                    else if (request.Type == "out") product.Stock -= request.Quantity;
                    else if (request.Type == "adjust") product.Stock = request.Quantity; // For adjust, we might treat quantity as the new absolute value, or as delta. Let's assume delta for simplicity, wait, if adjust, usually it's delta.
                    balanceAfter = product.Stock;
                }
            }
            else if (request.ItemSource == "supply")
            {
                var supply = await _dbContext.Supplies.FirstOrDefaultAsync(s => s.Id == request.ItemId);
                if (supply != null)
                {
                    if (request.Type == "in") supply.Quantity += request.Quantity;
                    else if (request.Type == "out") supply.Quantity -= request.Quantity;
                    else if (request.Type == "adjust") supply.Quantity = request.Quantity;
                    balanceAfter = supply.Quantity;
                }
            }

            var sm = new StockMovement
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
                ItemSource = request.ItemSource,
                ItemId = request.ItemId,
                ItemName = request.ItemName,
                Type = request.Type,
                Quantity = request.Quantity,
                BalanceAfter = balanceAfter,
                Reason = request.Reason
            };

            _dbContext.StockMovements.Add(sm);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { id = sm.Id }, ToDto(sm));
        }

        private static StockMovementDto ToDto(StockMovement sm) => new()
        {
            Id = sm.Id,
            CreatedAt = sm.CreatedAt,
            ItemSource = sm.ItemSource,
            ItemId = sm.ItemId,
            ItemName = sm.ItemName,
            Type = sm.Type,
            Quantity = sm.Quantity,
            BalanceAfter = sm.BalanceAfter,
            Reason = sm.Reason
        };
    }
}

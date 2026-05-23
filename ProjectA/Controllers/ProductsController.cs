using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
using ProjectA.Dtos.Common;
using ProjectA.Dtos.Product;
using ProjectA.Models;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;

        public ProductsController(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        [Authorize(Policy = Policies.ProductView)]
        public async Task<ActionResult<PagedResult<ProductDto>>> GetAll([FromQuery] QueryOptions opts)
        {
            var query = _dbContext.Products.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(opts.Search))
            {
                var s = opts.Search.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(s) || (p.Category != null && p.Category.ToLower().Contains(s)));
            }

            query = opts.SortBy?.ToLower() switch
            {
                "price" => opts.SortDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
                "stock" => opts.SortDesc ? query.OrderByDescending(p => p.Stock) : query.OrderBy(p => p.Stock),
                _ => opts.SortDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name)
            };

            var totalCount = await query.CountAsync();
            var items = await query.Skip((opts.Page - 1) * opts.PageSize).Take(opts.PageSize)
                .Select(p => ToDto(p))
                .ToListAsync();

            return Ok(new PagedResult<ProductDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = opts.Page,
                PageSize = opts.PageSize
            });
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.ProductView)]
        public async Task<ActionResult<ProductDto>> GetById(Guid id)
        {
            var product = await _dbContext.Products
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => ToDto(p))
                .FirstOrDefaultAsync();

            if (product is null)
            {
                return NotFound();
            }

            return Ok(product);
        }

        [HttpPost]
        [Authorize(Policy = Policies.ProductAdd)]
        public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductRequest request)
        {
            var product = new Product
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Category = request.Category,
                Price = request.Price,
                Stock = request.Stock
            };

            _dbContext.Products.Add(product);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToDto(product));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.ProductEdit)]
        public async Task<ActionResult<ProductDto>> Update(Guid id, [FromBody] UpdateProductRequest request)
        {
            var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product is null)
            {
                return NotFound();
            }

            product.Name = request.Name;
            product.Category = request.Category;
            product.Price = request.Price;
            product.Stock = request.Stock;

            await _dbContext.SaveChangesAsync();

            return Ok(ToDto(product));
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.ProductDelete)]
        public async Task<IActionResult> Delete(Guid id)
        {
            var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product is null)
            {
                return NotFound();
            }

            _dbContext.Products.Remove(product);
            await _dbContext.SaveChangesAsync();
            return NoContent();
        }

        private static ProductDto ToDto(Product p) => new()
        {
            Id = p.Id,
            Name = p.Name,
            Category = p.Category,
            Price = p.Price,
            Stock = p.Stock
        };
    }
}

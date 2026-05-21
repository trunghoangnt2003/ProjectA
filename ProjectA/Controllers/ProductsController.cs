using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectA.Authorization;
using ProjectA.Data;
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
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
        {
            var products = await _dbContext.Products
                .AsNoTracking()
                .OrderBy(p => p.Name)
                .Select(p => ToDto(p))
                .ToListAsync();

            return Ok(products);
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

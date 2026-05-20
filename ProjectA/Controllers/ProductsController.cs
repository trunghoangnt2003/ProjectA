using System.Security.Claims;
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
                .OrderByDescending(p => p.CreatedAtUtc)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    CreatedAtUtc = p.CreatedAtUtc,
                    CreatedByUserId = p.CreatedByUserId
                })
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
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    CreatedAtUtc = p.CreatedAtUtc,
                    CreatedByUserId = p.CreatedByUserId
                })
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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var product = new Product
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedByUserId = Guid.Parse(userId)
            };

            _dbContext.Products.Add(product);
            await _dbContext.SaveChangesAsync();

            return Ok(new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                CreatedAtUtc = product.CreatedAtUtc,
                CreatedByUserId = product.CreatedByUserId
            });
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
            product.Description = request.Description;
            product.Price = request.Price;

            await _dbContext.SaveChangesAsync();

            return Ok(new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                CreatedAtUtc = product.CreatedAtUtc,
                CreatedByUserId = product.CreatedByUserId
            });
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
    }
}

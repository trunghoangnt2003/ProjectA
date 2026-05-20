using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectA.Dtos.Files;
using ProjectA.Services;

namespace ProjectA.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        private readonly IImageStorageService _imageStorageService;

        public FilesController(IImageStorageService imageStorageService)
        {
            _imageStorageService = imageStorageService;
        }

        [HttpPost("images")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ImageUploadResponse>> UploadImage(IFormFile file, CancellationToken cancellationToken)
        {
            if (file is null || file.Length == 0)
            {
                return BadRequest("File is required.");
            }

            if (string.IsNullOrWhiteSpace(file.ContentType) || !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Only image files are allowed.");
            }

            var result = await _imageStorageService.UploadImageAsync(file, cancellationToken);
            return Ok(new ImageUploadResponse
            {
                Url = result.Url,
                ObjectName = result.ObjectName,
                Size = result.Size,
                ContentType = result.ContentType
            });
        }
    }
}

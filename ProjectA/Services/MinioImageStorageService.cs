using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using ProjectA.Options;

namespace ProjectA.Services
{
    public record ImageUploadResult(string Url, string ObjectName, long Size, string ContentType);

    public interface IImageStorageService
    {
        Task<ImageUploadResult> UploadImageAsync(IFormFile file, CancellationToken cancellationToken);
    }

    public class MinioImageStorageService : IImageStorageService
    {
        private readonly MinioOptions _options;

        public MinioImageStorageService(IOptions<MinioOptions> options)
        {
            _options = options.Value;
        }

        public async Task<ImageUploadResult> UploadImageAsync(IFormFile file, CancellationToken cancellationToken)
        {
            var client = CreateClient();
            var bucket = string.IsNullOrWhiteSpace(_options.Bucket) ? "images" : _options.Bucket;

            var bucketExists = await client.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(bucket),
                cancellationToken);

            if (!bucketExists)
            {
                await client.MakeBucketAsync(
                    new MakeBucketArgs().WithBucket(bucket),
                    cancellationToken);
            }

            var policy = CreatePublicReadPolicy(bucket);
            await client.SetPolicyAsync(
                new SetPolicyArgs().WithBucket(bucket).WithPolicy(policy),
                cancellationToken);

            var extension = Path.GetExtension(file.FileName);
            var objectName = $"{DateTime.UtcNow:yyyyMMdd}/{Guid.NewGuid():N}{extension}";
            var contentType = string.IsNullOrWhiteSpace(file.ContentType)
                ? "application/octet-stream"
                : file.ContentType;

            await using var stream = file.OpenReadStream();
            await client.PutObjectAsync(
                new PutObjectArgs()
                    .WithBucket(bucket)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(file.Length)
                    .WithContentType(contentType),
                cancellationToken);

            var url = BuildPublicUrl(bucket, objectName);
            return new ImageUploadResult(url, objectName, file.Length, contentType);
        }

        private MinioClient CreateClient()
        {
            if (string.IsNullOrWhiteSpace(_options.Endpoint))
            {
                throw new InvalidOperationException("Minio:Endpoint is required.");
            }

            if (string.IsNullOrWhiteSpace(_options.AccessKey) || string.IsNullOrWhiteSpace(_options.SecretKey))
            {
                throw new InvalidOperationException("Minio:AccessKey and Minio:SecretKey are required.");
            }

            var builder = new MinioClient()
                .WithEndpoint(_options.Endpoint)
                .WithCredentials(_options.AccessKey, _options.SecretKey);

            if (_options.UseSsl)
            {
                builder = builder.WithSSL();
            }

            return (MinioClient)builder.Build();
        }

        private string BuildPublicUrl(string bucket, string objectName)
        {
            var baseUrl = string.IsNullOrWhiteSpace(_options.PublicBaseUrl)
                ? $"{(_options.UseSsl ? "https" : "http")}://{_options.Endpoint}"
                : _options.PublicBaseUrl;

            return $"{baseUrl.TrimEnd('/')}/{bucket}/{objectName}";
        }

        private static string CreatePublicReadPolicy(string bucket)
        {
            return $$"""
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": {
                    "AWS": ["*"]
                  },
                  "Action": ["s3:GetObject"],
                  "Resource": ["arn:aws:s3:::{{bucket}}/*"]
                }
              ]
            }
            """;
        }
    }
}

namespace ProjectA.Dtos.Files
{
    public class ImageUploadResponse
    {
        public string Url { get; set; } = string.Empty;
        public string ObjectName { get; set; } = string.Empty;
        public long Size { get; set; }
        public string ContentType { get; set; } = string.Empty;
    }
}

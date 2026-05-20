namespace ProjectA.Options
{
    public class MinioOptions
    {
        public string Endpoint { get; set; } = string.Empty;
        public string AccessKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string Bucket { get; set; } = "images";
        public bool UseSsl { get; set; }
        public string PublicBaseUrl { get; set; } = string.Empty;
    }
}

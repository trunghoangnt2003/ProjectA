namespace ProjectA.Models
{
    public class Combo
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public bool Active { get; set; } = true;
        
        // Navigation
        public ICollection<ComboLine> Lines { get; set; } = new List<ComboLine>();
    }

    public class ComboLine
    {
        public Guid Id { get; set; }
        public Guid ComboId { get; set; }
        public Guid RefId { get; set; } // ID of Product or Supply
        public string Source { get; set; } = "product"; // "product" or "supply"
        public string Name { get; set; } = string.Empty; // Cached name
        public int Quantity { get; set; }

        public Combo? Combo { get; set; }
    }
}

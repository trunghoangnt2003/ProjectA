using Microsoft.AspNetCore.Mvc;

namespace ProjectA.Dtos.Common
{
    public class QueryOptions
    {
        [FromQuery(Name = "page")]
        public int Page { get; set; } = 1;

        [FromQuery(Name = "pageSize")]
        public int PageSize { get; set; } = 50;

        private DateTime? _startDate;
        [FromQuery(Name = "startDate")]
        public DateTime? StartDate 
        { 
            get => _startDate; 
            set => _startDate = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null; 
        }

        private DateTime? _endDate;
        [FromQuery(Name = "endDate")]
        public DateTime? EndDate 
        { 
            get => _endDate; 
            set => _endDate = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null; 
        }

        [FromQuery(Name = "sortBy")]
        public string? SortBy { get; set; }

        [FromQuery(Name = "sortDesc")]
        public bool SortDesc { get; set; } = true;

        [FromQuery(Name = "search")]
        public string? Search { get; set; }
    }
}

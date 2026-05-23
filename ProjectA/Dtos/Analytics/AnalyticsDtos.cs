namespace ProjectA.Dtos.Analytics
{
    public class AnalyticsOverviewDto
    {
        public decimal RevenueToday { get; set; }
        public int BookingsToday { get; set; }
        public int OperationalCourts { get; set; }
        public int TotalCourts { get; set; }
        public int FreeCourtsNow { get; set; }
        public int PlayingNow { get; set; }
        public decimal OccupancyToday { get; set; }
    }

    public class AnalyticsReportsDto
    {
        public List<RevenueByDayDto> Revenue { get; set; } = new();
        public List<BookingTrendDto> Trends { get; set; } = new();
        public List<PeakHourDto> Peak { get; set; } = new();
        public List<TopCustomerDto> Tops { get; set; } = new();
        public List<CourtPerformanceDto> Courts { get; set; } = new();
    }

    public class RevenueByDayDto
    {
        public string Date { get; set; } = null!;
        public decimal Tiền_sân { get; set; }
        public decimal Bán_hàng { get; set; }
    }

    public class BookingTrendDto
    {
        public string Date { get; set; } = null!;
        public int Lượt_đặt { get; set; }
        public int Hủy { get; set; }
    }

    public class PeakHourDto
    {
        public string Hour { get; set; } = null!;
        public int Lượt_đặt { get; set; }
    }

    public class TopCustomerDto
    {
        public string Name { get; set; } = null!;
        public decimal Chi_tiêu { get; set; }
    }

    public class CourtPerformanceDto
    {
        public string Court { get; set; } = null!;
        public decimal Doanh_thu { get; set; }
    }
}

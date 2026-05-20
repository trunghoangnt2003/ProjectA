namespace ProjectA.Options
{
    public class BusinessHoursOptions
    {
        public TimeOnly Start { get; set; } = new TimeOnly(8, 0);
        public TimeOnly End { get; set; } = new TimeOnly(23, 45);
    }
}

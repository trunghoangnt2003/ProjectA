namespace ProjectA.Authorization
{
    public readonly record struct ShiftWindow(TimeOnly Start, TimeOnly End);

    /// <summary>
    /// Khung giờ 3 ca làm việc. Phải khớp với frontend/src/constants/shifts.ts.
    /// Ca S2 kết thúc lúc 24:00 → biểu diễn bằng 00:00 (qua nửa đêm); logic kiểm tra
    /// trong handler đã xử lý trường hợp Start > End.
    /// </summary>
    public static class WorkShifts
    {
        public static readonly IReadOnlyDictionary<string, ShiftWindow> All =
            new Dictionary<string, ShiftWindow>(StringComparer.OrdinalIgnoreCase)
            {
                ["S1"] = new(new TimeOnly(8, 0), new TimeOnly(17, 0)),  // 08:00–17:00
                ["S2"] = new(new TimeOnly(17, 0), new TimeOnly(0, 0)),  // 17:00–24:00
                ["S3"] = new(new TimeOnly(0, 0), new TimeOnly(8, 0)),   // 00:00–08:00
            };

        public static bool TryGet(string? code, out ShiftWindow window)
        {
            window = default;
            return !string.IsNullOrWhiteSpace(code) && All.TryGetValue(code, out window);
        }
    }
}

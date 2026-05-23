import { api } from "./api";

export interface OverviewMetrics {
  revenueToday: number;
  bookingsToday: number;
  operationalCourts: number;
  totalCourts: number;
  freeCourtsNow: number;
  playingNow: number;
  occupancyToday: number;
}

export interface AnalyticsReports {
  revenue: { date: string; "Tiền sân": number; "Bán hàng": number }[];
  trends: { date: string; "Lượt đặt": number; "Hủy": number }[];
  peak: { hour: string; "Lượt đặt": number }[];
  tops: { name: string; "Chi tiêu": number }[];
  courts: { court: string; "Doanh thu": number }[];
}

export const analyticsService = {
  getOverview: async (): Promise<OverviewMetrics> => {
    const res = await api.get("/analytics/overview");
    return res.data;
  },

  getReports: async (days: number): Promise<AnalyticsReports> => {
    const res = await api.get(`/analytics/reports?days=${days}`);
    return res.data;
  },
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, eachDayOfInterval, format, differenceInDays } from "date-fns";

interface UseMarketingAnalyticsParams {
  dateFrom: Date;
  dateTo: Date;
  pdvId?: string;
}

export interface DailyDataPoint {
  date: string;
  dateDisplay: string;
  count: number;
}

export interface MarketingAnalyticsData {
  totalLeads: number;
  totalClicks: number;
  conversionRate: number;
  avgLeadsPerDay: number;
  leadsByDay: DailyDataPoint[];
  clicksByDay: DailyDataPoint[];
  isLoading: boolean;
}

export function useMarketingAnalytics({ dateFrom, dateTo, pdvId }: UseMarketingAnalyticsParams): MarketingAnalyticsData {
  const from = startOfDay(dateFrom).toISOString();
  const to = endOfDay(dateTo).toISOString();

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["marketing-analytics-leads", from, to, pdvId],
    queryFn: async () => {
      let query = supabase
        .from("catalog_leads")
        .select("created_at")
        .gte("created_at", from)
        .lte("created_at", to);

      if (pdvId) {
        query = query.eq("pdv_id", pdvId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clicks = [], isLoading: clicksLoading } = useQuery({
    queryKey: ["marketing-analytics-clicks", from, to, pdvId],
    queryFn: async () => {
      // Get short link IDs for the PDV filter
      if (pdvId) {
        const { data: links } = await supabase
          .from("catalog_short_links")
          .select("id")
          .eq("pdv_id", pdvId);

        if (!links || links.length === 0) return [];

        const linkIds = links.map((l) => l.id);
        const { data, error } = await supabase
          .from("link_click_events")
          .select("clicked_at")
          .in("short_link_id", linkIds)
          .gte("clicked_at", from)
          .lte("clicked_at", to);

        if (error) throw error;
        return data || [];
      }

      const { data, error } = await supabase
        .from("link_click_events")
        .select("clicked_at")
        .gte("clicked_at", from)
        .lte("clicked_at", to);

      if (error) throw error;
      return data || [];
    },
  });

  // Build daily data
  const days = eachDayOfInterval({ start: dateFrom, end: dateTo });
  const dayCount = differenceInDays(dateTo, dateFrom) + 1;

  const leadsByDay: DailyDataPoint[] = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const count = leads.filter(
      (l) => format(new Date(l.created_at), "yyyy-MM-dd") === dayStr
    ).length;
    return { date: dayStr, dateDisplay: format(day, "dd/MM"), count };
  });

  const clicksByDay: DailyDataPoint[] = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const count = clicks.filter(
      (c) => format(new Date(c.clicked_at), "yyyy-MM-dd") === dayStr
    ).length;
    return { date: dayStr, dateDisplay: format(day, "dd/MM"), count };
  });

  const totalLeads = leads.length;
  const totalClicks = clicks.length;
  const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
  const avgLeadsPerDay = dayCount > 0 ? totalLeads / dayCount : 0;

  return {
    totalLeads,
    totalClicks,
    conversionRate,
    avgLeadsPerDay,
    leadsByDay,
    clicksByDay,
    isLoading: leadsLoading || clicksLoading,
  };
}

import { supabase } from "@/integrations/supabase/client";

export interface FishData {
  today: { up: number; down: number; total: number };
  yesterday: { up: number; down: number; total: number };
  yearTotal: { up: number; down: number; total: number };
  deltas: {
    vsYesterday: { up: number; down: number; total: number };
    vsLastWeek: { up: number; down: number; total: number };
  };
}

export interface SnowData {
  depth: number;
  unit: string;
}

export interface RiverData {
  streamflow: number | null;
  streamflowUnit: string;
  riverStage: number | null;
  riverStageUnit: string;
  waterTemp: number | null;
  waterTempUnit: string;
}

export interface DashboardData {
  fish: FishData | null;
  snow: SnowData | null;
  river: RiverData | null;
  chartData: Array<{ date: string; net: number }>;
  lastUpdated: string;
  errors: string[];
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const { data, error } = await supabase.functions.invoke("scrape-fishing-data");

  if (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error(error.message || "Failed to fetch dashboard data");
  }

  return data;
}

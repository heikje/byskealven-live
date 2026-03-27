import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/lib/api/fishing-data";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FishCounterCard } from "@/components/FishCounterCard";
import { SnowDepthCard } from "@/components/SnowDepthCard";
import { FishChart } from "@/components/FishChart";
import { StatusIndicator } from "@/components/StatusIndicator";

const Index = () => {
  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: fetchDashboardData,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader
          lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null}
          isLoading={isLoading}
          onRefresh={() => refetch()}
        />

        <StatusIndicator errors={data?.errors ?? []} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <FishCounterCard data={data?.fish ?? null} isLoading={isLoading} />
          <SnowDepthCard data={data?.snow ?? null} isLoading={isLoading} />
        </div>

        <div className="mt-4">
          <FishChart data={data?.chartData ?? []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;

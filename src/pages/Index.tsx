import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/lib/api/fishing-data";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FishCounterCard } from "@/components/FishCounterCard";
import { SnowDepthCard } from "@/components/SnowDepthCard";
import riverHero from "@/assets/river-hero.jpg";
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
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img
          src={riverHero}
          alt="Byskeälven river"
          className="w-full h-full object-cover"
          width={1920}
          height={640}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
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

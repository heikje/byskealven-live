import { Fish, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import type { FishData } from "@/lib/api/fishing-data";

interface FishCounterCardProps {
  data: FishData | null;
  isLoading: boolean;
}

export const FishCounterCard = ({ data, isLoading }: FishCounterCardProps) => {
  const netToday = data ? data.today.up - data.today.down : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 col-span-full lg:col-span-2"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Fish className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Fish Counter</h2>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
          Byskeälven
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 bg-muted rounded-lg animate-pulse w-2/3" />
        </div>
      ) : data ? (
        <>
          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-primary glow-text font-mono">
              {netToday}
            </p>
            <p className="text-muted-foreground text-sm mt-1">net passages today</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatBox
              label="Up"
              value={data.today.up}
              icon={<ArrowUp className="h-3.5 w-3.5 text-fish-up" />}
              color="text-fish-up"
            />
            <StatBox
              label="Down"
              value={data.today.down}
              icon={<ArrowDown className="h-3.5 w-3.5 text-fish-down" />}
              color="text-fish-down"
            />
            <StatBox
              label="Year Total"
              value={data.yearTotal.total}
              color="text-foreground"
            />
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <DeltaIndicator label="vs yesterday" value={data.deltas.vsYesterday.total} />
            <DeltaIndicator label="vs last week" value={data.deltas.vsLastWeek.total} />
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-center py-8">No data available</p>
      )}

      <a href="https://fiskdata.se/raknare/live/live.php?locationId=17" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary transition-colors mt-4 inline-flex items-center gap-1">Source: fiskdata.se ↗</a>
    </motion.div>
  );
};

function StatBox({ label, value, icon, color = "text-foreground" }: { label: string; value: number; icon?: React.ReactNode; color?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold font-mono ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function DeltaIndicator({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;
  return (
    <span className="flex items-center gap-1">
      {isPositive ? (
        <TrendingUp className="h-3 w-3 text-fish-up" />
      ) : (
        <TrendingDown className="h-3 w-3 text-fish-down" />
      )}
      <span className={isPositive ? "text-fish-up" : "text-fish-down"}>
        {isPositive ? "+" : ""}{value}
      </span>
      {label}
    </span>
  );
}

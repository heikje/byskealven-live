import { Snowflake } from "lucide-react";
import { motion } from "framer-motion";
import type { SnowData } from "@/lib/api/fishing-data";

interface SnowDepthCardProps {
  data: SnowData | null;
  isLoading: boolean;
}

export const SnowDepthCard = ({ data, isLoading }: SnowDepthCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-snow" />
          <h2 className="font-semibold text-lg">Snow Depth</h2>
        </div>
        <span className="text-xs bg-snow/10 text-snow px-2 py-1 rounded-full font-medium">
          SMHI
        </span>
      </div>

      {isLoading ? (
        <div className="h-20 bg-muted rounded-lg animate-pulse" />
      ) : data ? (
        <div className="text-center py-4">
          <p className="text-5xl font-bold text-snow font-mono">
            {data.depth}
          </p>
          <p className="text-muted-foreground text-sm mt-1">{data.unit}</p>
          <p className="text-xs text-muted-foreground mt-3">Latest reported depth</p>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No data available</p>
      )}

      <p className="text-[10px] text-muted-foreground mt-4">Source: smhi.se</p>
    </motion.div>
  );
};

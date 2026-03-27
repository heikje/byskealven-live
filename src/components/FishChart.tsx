import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface FishChartProps {
  data: Array<{ date: string; net: number }>;
  isLoading: boolean;
}

export const FishChart = ({ data, isLoading }: FishChartProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 col-span-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Fish Passage Trend</h2>
      </div>

      {isLoading ? (
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fishGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="hsl(220, 10%, 40%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(220, 10%, 40%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 14%)",
                border: "1px solid hsl(220, 15%, 22%)",
                borderRadius: "0.5rem",
                color: "hsl(45, 20%, 90%)",
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(220, 10%, 55%)" }}
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="hsl(160, 60%, 45%)"
              strokeWidth={2}
              fill="url(#fishGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted-foreground text-center py-12">No chart data available</p>
      )}

      <a href="https://fiskdata.se/raknare/live/live.php?locationId=17" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary transition-colors mt-2 inline-flex items-center gap-1">Source: fiskdata.se ↗</a>
    </motion.div>
  );
};

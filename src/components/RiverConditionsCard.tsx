import { Waves, Thermometer, ArrowUpDown, Droplets } from "lucide-react";
import { motion } from "framer-motion";

export interface RiverData {
  streamflow: number | null;
  streamflowUnit: string;
  riverStage: number | null;
  riverStageUnit: string;
  waterTemp: number | null;
  waterTempUnit: string;
}

interface RiverConditionsCardProps {
  data: RiverData | null;
  isLoading: boolean;
}

export const RiverConditionsCard = ({ data, isLoading }: RiverConditionsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card p-6 lg:col-span-2"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-water" />
          <h2 className="font-semibold text-lg">River Conditions</h2>
        </div>
        <span className="text-xs bg-water/10 text-water px-2 py-1 rounded-full font-medium">
          Byskeälven
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-3 gap-4">
          <MetricTile
            icon={<Droplets className="h-4 w-4 text-water" />}
            label="Streamflow"
            value={data.streamflow}
            unit={data.streamflowUnit}
          />
          <MetricTile
            icon={<ArrowUpDown className="h-4 w-4 text-primary" />}
            label="River Stage"
            value={data.riverStage != null ? Math.round(data.riverStage) : null}
            unit={data.riverStageUnit}
          />
          <MetricTile
            icon={<Thermometer className="h-4 w-4 text-accent" />}
            label="Water Temp"
            value={data.waterTemp}
            unit={data.waterTempUnit}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No data available</p>
      )}

      <p className="text-[10px] text-muted-foreground mt-4">Source: riverapp.net / SMHI</p>
    </motion.div>
  );
};

function MetricTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {value != null ? (
        <>
          <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">N/A</p>
      )}
    </div>
  );
}

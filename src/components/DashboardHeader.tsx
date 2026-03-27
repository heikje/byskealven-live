import { Fish, Mountain, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  lastUpdated: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const DashboardHeader = ({ lastUpdated, isLoading, onRefresh }: DashboardHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
    >
      <div className="flex items-center gap-3">
        <div className="gradient-river p-3 rounded-xl">
          <Fish className="h-7 w-7 text-foreground" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Byskeälven <span className="text-primary glow-text">Live</span>
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            <Mountain className="h-3.5 w-3.5" />
            Fishing & Weather Dashboard
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs text-muted-foreground font-mono">
            Updated {new Date(lastUpdated).toLocaleTimeString("sv-SE")}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-secondary-foreground ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </motion.header>
  );
};

import { Snowflake, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export const SnowDepthCard = () => {
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

      <div className="text-center py-6">
        <p className="text-muted-foreground text-sm mb-4">
          Check current snow depth observations on SMHI
        </p>
        <a
          href="https://www.smhi.se/vader/observationer/snodjup"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          View on smhi.se
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </motion.div>
  );
};

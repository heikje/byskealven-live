import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface StatusIndicatorProps {
  errors: string[];
  isLoading: boolean;
}

export const StatusIndicator = ({ errors, isLoading }: StatusIndicatorProps) => {
  if (isLoading) return null;

  if (errors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-xs text-primary"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        All sources connected
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-3 col-span-full"
    >
      {errors.map((err, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-accent">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {err}
        </div>
      ))}
    </motion.div>
  );
};

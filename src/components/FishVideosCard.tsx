import { Video, ArrowUp, ArrowDown, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export interface FishVideo {
  dateTime: string;
  species: string;
  direction: string;
  length: number;
  thumb: string;
  video: string;
}

interface FishVideosCardProps {
  videos: FishVideo[];
  isLoading: boolean;
}

export const FishVideosCard = ({ videos, isLoading }: FishVideosCardProps) => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card p-6 col-span-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <Video className="h-5 w-5 text-accent" />
        <h2 className="font-semibold text-lg">Latest Fish Videos</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <>
          {activeVideo && (
            <div className="mb-4 rounded-lg overflow-hidden bg-muted">
              <video
                src={activeVideo}
                controls
                autoPlay
                className="w-full max-h-80 object-contain bg-muted"
              />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {videos.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveVideo(v.video)}
                className={`group relative rounded-lg overflow-hidden border transition-all ${
                  activeVideo === v.video
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <img
                  src={v.thumb}
                  alt={`${v.species} - ${v.dateTime}`}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground font-medium">{v.species}</span>
                    <span className="flex items-center gap-0.5">
                      {v.direction === "up" ? (
                        <ArrowUp className="h-2.5 w-2.5 text-fish-up" />
                      ) : (
                        <ArrowDown className="h-2.5 w-2.5 text-fish-down" />
                      )}
                      <span className="text-muted-foreground">{v.length} cm</span>
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-mono">{v.dateTime}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-center py-8">No videos available</p>
      )}

      <p className="text-[10px] text-muted-foreground mt-4">Source: fiskdata.se</p>
    </motion.div>
  );
};

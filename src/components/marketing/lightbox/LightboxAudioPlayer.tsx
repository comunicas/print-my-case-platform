import { useState, useMemo } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingMedia } from "./types";
import { formatTime } from "./utils";

interface LightboxAudioPlayerProps {
  media: MarketingMedia;
}

export function LightboxAudioPlayer({ media }: LightboxAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Generate random wave heights for audio visualization
  const waveHeights = useMemo(() => 
    Array.from({ length: 40 }, () => Math.random() * 100), 
    []
  );

  const togglePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioElement) {
      setAudioProgress((audioElement.currentTime / audioElement.duration) * 100);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioElement) {
      setAudioDuration(audioElement.duration);
    }
  };

  const handleAudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audioElement.currentTime = percent * audioElement.duration;
    }
  };

  return (
    <div className="w-full max-w-2xl bg-card rounded-xl p-8 space-y-6">
      <audio
        ref={setAudioElement}
        src={media.file_url}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Waveform visualization */}
      <div className="flex items-end justify-center gap-1 h-32">
        {waveHeights.map((height, i) => (
          <div
            key={i}
            className={`w-2 rounded-full transition-all duration-150 ${
              (i / waveHeights.length) * 100 <= audioProgress
                ? "bg-primary"
                : "bg-muted"
            }`}
            style={{ 
              height: `${Math.max(20, height)}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
        onClick={handleAudioSeek}
      >
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${audioProgress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {audioElement ? formatTime(audioElement.currentTime) : "0:00"}
        </span>
        
        <Button
          size="lg"
          onClick={togglePlayPause}
          className="h-16 w-16 rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>

        <span className="text-sm text-muted-foreground">
          {formatTime(audioDuration)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        <span className="text-sm">{media.title}</span>
      </div>
    </div>
  );
}

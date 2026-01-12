import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "navigation";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 30, 10],
  error: [50, 30, 50, 30, 50],
  navigation: 5, // Ultra sutil para navegação contínua
};

export function useHapticFeedback() {
  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    if (typeof navigator === "undefined" || !navigator.vibrate) {
      return false;
    }
    
    try {
      return navigator.vibrate(patterns[pattern]);
    } catch {
      return false;
    }
  }, []);

  const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

  return { vibrate, isSupported };
}

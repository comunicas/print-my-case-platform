export interface MarketingMedia {
  id: string;
  title: string;
  file_url: string;
  media_type: string;
  file_size: number | null;
}

export interface MediaLightboxProps {
  media: MarketingMedia | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
  pdvName?: string;
}

export interface SlideshowState {
  active: boolean;
  interval: number;
  progress: number;
}

export interface ZoomState {
  level: number;
  panPosition: { x: number; y: number };
}

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export const SLIDESHOW_INTERVALS = [
  { value: "3000", label: "3s" },
  { value: "5000", label: "5s" },
  { value: "10000", label: "10s" },
  { value: "15000", label: "15s" },
];

export interface VideoDevice {
  deviceId: string;
  label: string;
}

export interface StreamSettings {
  deviceId: string;
  resolution: '4k' | '1080p' | '720p';
  frameRate: number;
}

export interface ImageSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  mirror: boolean;
}

export interface BroadcastState {
  isEcoMode: boolean;
  isTorchOn: boolean;
  showTally: boolean;
  networkUrl: string;
}

export interface AIAnalysisResult {
  lighting: string;
  composition: string;
  advice: string;
}

export interface GeneratedOverlay {
  id: string;
  svgContent: string;
  position: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left' | 'center' | 'full';
}
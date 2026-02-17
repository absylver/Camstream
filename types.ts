export interface VideoDevice {
  deviceId: string;
  label: string;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface StreamSettings {
  deviceId: string;
  audioDeviceId?: string;
  resolution: '4k' | '1080p' | '720p';
  frameRate: number;
}

export interface ImageSettings {
  mirror: boolean;
  saturation: number;
}

export interface BroadcastState {
  isEcoMode: boolean;
  isTorchOn: boolean;
  showTally: boolean;
  showGrid: boolean;
  networkUrl: string;
}

export interface AIAnalysisResult {
  lighting: string;
  composition: string;
  quality: string;
  advice: string;
}

export interface GeneratedOverlay {
  id: string;
  svgContent: string;
  position: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left' | 'center' | 'full';
}
import React, { useEffect, useRef } from 'react';
import { GeneratedOverlay, BroadcastState, ImageSettings } from '../types';

interface CameraStageProps {
  stream: MediaStream | null;
  overlay: GeneratedOverlay | null;
  onSnapshot: (blob: string) => void;
  cleanMode: boolean;
  broadcastState: BroadcastState;
  imageSettings: ImageSettings;
  onZoom: (val: number) => void;
  zoomLevel: number;
  capabilities: MediaTrackCapabilities | null;
}

const CameraStage: React.FC<CameraStageProps> = ({ 
  stream, 
  overlay, 
  onSnapshot, 
  cleanMode, 
  broadcastState, 
  imageSettings,
  onZoom,
  zoomLevel,
  capabilities
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Pinch-to-zoom refs
  const touchStartDist = useRef<number>(0);
  const startZoomLevel = useRef<number>(1);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Request Wake Lock
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          // @ts-ignore
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log("Wake Lock not supported or rejected");
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // Expose snapshot method
  useEffect(() => {
    const capture = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const vid = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // We must draw the image with filters if we want the snapshot to match
        // But drawing filters to canvas is complex (needs filter prop on context).
        // For simplicity in analysis, raw feed is usually better, but let's try to match.
        ctx.filter = `saturate(${imageSettings.saturation})`;
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onSnapshot(base64);
      }
    };
    
    const handleTrigger = () => capture();
    window.addEventListener('TRIGGER_SNAPSHOT', handleTrigger);
    return () => window.removeEventListener('TRIGGER_SNAPSHOT', handleTrigger);
  }, [onSnapshot, imageSettings.saturation]);

  // Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      touchStartDist.current = dist;
      startZoomLevel.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );

      if (touchStartDist.current > 0) {
        const scale = dist / touchStartDist.current;
        let newZoom = startZoomLevel.current * scale;
        
        // Clamp based on capabilities
        // @ts-ignore
        const maxZoom = capabilities?.zoom?.max || 3;
        // @ts-ignore
        const minZoom = capabilities?.zoom?.min || 1;
        
        newZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
        onZoom(newZoom);
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = 0;
  };

  return (
    <div 
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${broadcastState.showTally ? 'border-8 border-red-600' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }} // Prevent browser zooming/scrolling
    >
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transition-all duration-200" 
        style={{ 
          objectFit: 'contain',
          transform: imageSettings.mirror ? 'scaleX(-1)' : 'none',
          filter: `saturate(${imageSettings.saturation})`
        }}
      />

      {/* Grid Overlay */}
      {broadcastState.showGrid && (
        <div className="absolute inset-0 z-20 pointer-events-none opacity-50">
           {/* Thirds Grid */}
           <div className="absolute top-1/3 left-0 w-full h-px bg-white/70"></div>
           <div className="absolute top-2/3 left-0 w-full h-px bg-white/70"></div>
           <div className="absolute left-1/3 top-0 w-px h-full bg-white/70"></div>
           <div className="absolute left-2/3 top-0 w-px h-full bg-white/70"></div>
        </div>
      )}

      {/* Generated Overlay Layer */}
      {overlay && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: overlay.svgContent }}
        />
      )}

      {/* Hidden Canvas for Snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Eco Mode Curtain */}
      {broadcastState.isEcoMode && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-gray-500">
          <div className="animate-pulse flex flex-col items-center">
            <span className="text-4xl mb-2">🔋</span>
            <p className="font-mono text-sm">ECO MODE ACTIVE</p>
            <p className="text-xs">Camera is running.</p>
            <p className="text-xs mt-4">Tap UI controls to wake.</p>
          </div>
        </div>
      )}

      {/* Clean Mode Indicator (Briefly flashes) */}
      {cleanMode && !broadcastState.isEcoMode && (
        <div className="absolute top-4 right-4 bg-red-600/50 text-white px-2 py-1 rounded text-xs font-mono animate-pulse pointer-events-none z-20">
          CLEAN FEED LIVE
        </div>
      )}
    </div>
  );
};

export default CameraStage;
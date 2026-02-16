import React, { useEffect, useRef } from 'react';
import { GeneratedOverlay, BroadcastState, ImageSettings } from '../types';

interface CameraStageProps {
  stream: MediaStream | null;
  overlay: GeneratedOverlay | null;
  onSnapshot: (blob: string) => void;
  cleanMode: boolean;
  broadcastState: BroadcastState;
  imageSettings: ImageSettings;
}

const CameraStage: React.FC<CameraStageProps> = ({ stream, overlay, onSnapshot, cleanMode, broadcastState, imageSettings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        // Draw with filters? 
        // Note: ctx.filter is supported in modern browsers, but we are capturing raw frame for analysis usually.
        // For analysis, we probably want the RAW frame (gemini sees what camera sees).
        // For OBS, the "Clean Feed" is this DOM element, so CSS filters applied to <video> are visible if capturing window.
        // If capturing via HDMI out, CSS filters on <video> work.
        
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onSnapshot(base64);
      }
    };
    
    const handleTrigger = () => capture();
    window.addEventListener('TRIGGER_SNAPSHOT', handleTrigger);
    return () => window.removeEventListener('TRIGGER_SNAPSHOT', handleTrigger);
  }, [onSnapshot]);

  const filterString = `
    brightness(${imageSettings.brightness}) 
    contrast(${imageSettings.contrast}) 
    saturate(${imageSettings.saturation}) 
    sepia(${imageSettings.sepia})
  `;

  return (
    <div className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${broadcastState.showTally ? 'border-8 border-red-600' : ''}`}>
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transition-all duration-200" 
        style={{ 
          objectFit: 'contain',
          filter: filterString,
          transform: imageSettings.mirror ? 'scaleX(-1)' : 'none'
        }}
      />

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
import React, { useState, useEffect, useCallback } from 'react';
import CameraStage from './components/CameraStage';
import Controls from './components/Controls';
import { useMediaStream } from './hooks/useMediaStream';
import { StreamSettings, AIAnalysisResult, GeneratedOverlay, BroadcastState, ImageSettings } from './types';
import { analyzeFrame, generateOverlay } from './services/geminiService';

// Initial settings
const DEFAULT_SETTINGS: StreamSettings = {
  deviceId: '',
  audioDeviceId: '', // Default to muted
  resolution: '1080p',
  frameRate: 30
};

const DEFAULT_BROADCAST_STATE: BroadcastState = {
  isEcoMode: false,
  isTorchOn: false,
  showTally: false,
  showGrid: false,
  networkUrl: '',
};

const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  mirror: false,
  saturation: 1.0
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<StreamSettings>(DEFAULT_SETTINGS);
  const [broadcastState, setBroadcastState] = useState<BroadcastState>(DEFAULT_BROADCAST_STATE);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [cleanMode, setCleanMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // AI State
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [currentOverlay, setCurrentOverlay] = useState<GeneratedOverlay | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera Hook
  const { stream, error, videoDevices, audioDevices, capabilities, applyZoom, toggleTorch, toggleBackgroundBlur, applyConstraint } = useMediaStream(settings);

  // Check URL params for clean mode (Auto-clean for OBS Browser Source)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clean') === 'true') {
      setCleanMode(true);
    }
  }, []);

  // Set default device if none selected
  useEffect(() => {
    if (!settings.deviceId && videoDevices.length > 0) {
      setSettings(s => ({ ...s, deviceId: videoDevices[0].deviceId }));
    }
  }, [videoDevices, settings.deviceId]);

  // Handle Snapshot for Analysis
  const handleSnapshotForAnalysis = useCallback(async (base64Image: string) => {
    setIsProcessing(true);
    try {
      const result = await analyzeFrame(base64Image);
      setAnalysisResult(result);
    } catch (e) {
      alert("Failed to analyze frame. Check API Key configuration.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const triggerAnalysis = () => {
    // Dispatch event to CameraStage to capture frame
    window.dispatchEvent(new Event('TRIGGER_SNAPSHOT'));
  };

  const handleGenerateOverlay = async (prompt: string) => {
    setIsProcessing(true);
    try {
      const overlay = await generateOverlay(prompt);
      setCurrentOverlay(overlay);
    } catch (e) {
      alert("Failed to generate overlay.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBroadcastState = (updates: Partial<BroadcastState>) => {
    setBroadcastState(prev => ({ ...prev, ...updates }));
  };

  const handleZoom = useCallback((level: number) => {
    setZoomLevel(level);
    applyZoom(level);
  }, [applyZoom]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      
      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 text-white p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-red-500 mb-2">Camera Access Error</h1>
            <p className="text-gray-300 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Please ensure you have granted camera permissions in your browser settings.</p>
          </div>
        </div>
      )}

      {/* Main Camera Stage */}
      <CameraStage 
        stream={stream} 
        overlay={currentOverlay} 
        onSnapshot={handleSnapshotForAnalysis}
        cleanMode={cleanMode}
        broadcastState={broadcastState}
        imageSettings={imageSettings}
        onZoom={handleZoom}
        zoomLevel={zoomLevel}
        capabilities={capabilities}
      />

      {/* Controls - Hidden in Clean Mode */}
      {!cleanMode && (
        <Controls
          settings={settings}
          onSettingsChange={setSettings}
          devices={videoDevices}
          audioDevices={audioDevices}
          capabilities={capabilities}
          onZoom={handleZoom}
          zoomLevel={zoomLevel}
          onAnalyze={triggerAnalysis}
          onGenerateOverlay={handleGenerateOverlay}
          analysisResult={analysisResult}
          isAnalyzing={isProcessing}
          onToggleCleanMode={() => setCleanMode(true)}
          overlayActive={!!currentOverlay}
          onClearOverlay={() => setCurrentOverlay(null)}
          broadcastState={broadcastState}
          onBroadcastChange={updateBroadcastState}
          onToggleTorch={toggleTorch}
          onToggleBackgroundBlur={toggleBackgroundBlur}
          imageSettings={imageSettings}
          onImageSettingsChange={setImageSettings}
          onApplyConstraint={applyConstraint}
        />
      )}

      {/* Clean Mode Exit Hint */}
      {cleanMode && (
        <div 
          className="absolute inset-0 z-50 cursor-pointer" 
          onClick={() => {
            // Only exit clean mode if NOT in eco mode (to prevent accidental touches)
            if (!broadcastState.isEcoMode) setCleanMode(false);
          }}
          title="Tap to exit Clean Mode"
        />
      )}

      {/* Eco Mode wake handler (Highest Z-index logic handled in CameraStage but touch needs to pass through) */}
      {broadcastState.isEcoMode && (
        <div 
          className="absolute inset-0 z-[60] cursor-pointer"
          onClick={() => updateBroadcastState({ isEcoMode: false })}
        />
      )}
    </div>
  );
};

export default App;
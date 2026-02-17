import React, { useState, useEffect } from 'react';
import { 
  Settings, Monitor, Sparkles, X, Aperture, Maximize2, Wifi, Zap, Battery, Link2, Copy, Check,
  SunMedium, ScanEye, FlipHorizontal, Thermometer, Mic, MicOff, Grid3X3, Droplets, UserRound
} from 'lucide-react';
import { StreamSettings, VideoDevice, AudioDevice, AIAnalysisResult, BroadcastState, ImageSettings } from '../types';

interface ControlsProps {
  settings: StreamSettings;
  onSettingsChange: (s: StreamSettings) => void;
  devices: VideoDevice[];
  audioDevices: AudioDevice[];
  capabilities: MediaTrackCapabilities | null;
  onZoom: (val: number) => void;
  zoomLevel: number;
  onAnalyze: () => void;
  onGenerateOverlay: (prompt: string) => void;
  analysisResult: AIAnalysisResult | null;
  isAnalyzing: boolean;
  onToggleCleanMode: () => void;
  overlayActive: boolean;
  onClearOverlay: () => void;
  broadcastState: BroadcastState;
  onBroadcastChange: (s: Partial<BroadcastState>) => void;
  onToggleTorch: (on: boolean) => void;
  onToggleBackgroundBlur: (on: boolean) => void;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  onApplyConstraint: (name: string, val: any) => void;
}

const Controls: React.FC<ControlsProps> = ({
  settings,
  onSettingsChange,
  devices,
  audioDevices,
  capabilities,
  onZoom,
  zoomLevel,
  onAnalyze,
  onGenerateOverlay,
  analysisResult,
  isAnalyzing,
  onToggleCleanMode,
  overlayActive,
  onClearOverlay,
  broadcastState,
  onBroadcastChange,
  onToggleTorch,
  onToggleBackgroundBlur,
  imageSettings,
  onImageSettingsChange,
  onApplyConstraint
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'camera' | 'connect' | 'ai'>('camera');
  const [overlayPrompt, setOverlayPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [localIp, setLocalIp] = useState("192.168.1.xxx");
  const [bgBlur, setBgBlur] = useState(false);
  
  // Hardware control states
  const [iso, setIso] = useState<number>(0);
  const [exposure, setExposure] = useState<number>(0);
  const [focusDistance, setFocusDistance] = useState<number>(0);
  const [wb, setWb] = useState<number>(0);
  const [blurDepth, setBlurDepth] = useState<number>(50);
  
  // Track Auto/Manual states locally for UI feedback
  const [autoIso, setAutoIso] = useState(true);
  const [autoFocus, setAutoFocus] = useState(true);
  const [autoWb, setAutoWb] = useState(true);
  const [autoExposure, setAutoExposure] = useState(true);

  // Attempt to guess protocol/port
  useEffect(() => {
    const port = window.location.port;
    setLocalIp(`<YOUR_PC_IP>${port ? ':' + port : ''}`);
  }, []);

  const handleCopyUrl = () => {
    const url = `${window.location.protocol}//${localIp}/?clean=true`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = (key: keyof ImageSettings, val: number | boolean) => {
    onImageSettingsChange({ ...imageSettings, [key]: val });
  };

  // Helper to safely get capabilities or reasonable defaults if the browser doesn't report them
  // This ensures the UI is always visible for the user to try.
  const getCapRange = (key: string, def: {min: number, max: number, step: number}) => {
    // @ts-ignore
    if (capabilities && capabilities[key]) {
      // @ts-ignore
      return capabilities[key];
    }
    return def;
  };

  // Safe checks for support (used only for initial state or critical disables if needed)
  // We largely ignore these for rendering to ensure UI availability
  // @ts-ignore
  const hasTorch = capabilities && 'torch' in capabilities;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 z-50 bg-gray-900/90 text-white p-3 rounded-full hover:bg-gray-800 transition-all shadow-lg border border-gray-700"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-black/85 backdrop-blur-xl border-l border-gray-800 text-white z-40 flex flex-col transition-transform">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Monitor className="text-red-500" /> CAM2PC
        </h2>
        <button onClick={() => setIsOpen(false)} className="hover:text-red-400">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button 
          onClick={() => setActiveTab('camera')}
          className={`flex-1 p-3 text-sm font-medium ${activeTab === 'camera' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}
        >
          Camera
        </button>
        <button 
          onClick={() => setActiveTab('connect')}
          className={`flex-1 p-3 text-sm font-medium ${activeTab === 'connect' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
        >
          Connect
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 p-3 text-sm font-medium ${activeTab === 'ai' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          Video Doctor
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Camera Controls */}
        {activeTab === 'camera' && (
          <div className="space-y-6">
            
            {/* Quick Toggles Grid */}
            <div className="grid grid-cols-4 gap-2">
               {/* Clean Mode */}
               <button 
                onClick={onToggleCleanMode}
                className="col-span-1 bg-gray-800 hover:bg-green-700 text-white p-2 rounded-lg flex flex-col items-center justify-center gap-1 border border-gray-700"
                title="Hide UI"
              >
                <Maximize2 size={16} />
                <span className="text-[10px]">Clean</span>
              </button>

              {/* Eco Mode */}
               <button 
                onClick={() => onBroadcastChange({ isEcoMode: !broadcastState.isEcoMode })}
                className={`col-span-1 rounded-lg flex flex-col items-center justify-center p-2 border ${broadcastState.isEcoMode ? 'bg-green-900/40 border-green-500' : 'bg-gray-800 border-gray-700'}`}
                title="Eco Mode"
              >
                <Battery size={16} />
                <span className="text-[10px]">Eco</span>
              </button>

              {/* Grid Toggle */}
              <button 
                onClick={() => onBroadcastChange({ showGrid: !broadcastState.showGrid })}
                className={`col-span-1 rounded-lg flex flex-col items-center justify-center p-2 border ${broadcastState.showGrid ? 'bg-blue-900/40 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700'}`}
                title="Show Grid"
              >
                <Grid3X3 size={16} />
                <span className="text-[10px]">Grid</span>
              </button>

               {/* Torch Toggle (Flashlight) */}
               <button 
                onClick={() => {
                  const newState = !broadcastState.isTorchOn;
                  onBroadcastChange({ isTorchOn: newState });
                  onToggleTorch(newState);
                }}
                disabled={!hasTorch}
                className={`col-span-1 rounded-lg flex flex-col items-center justify-center p-2 border ${broadcastState.isTorchOn ? 'bg-yellow-900/40 border-yellow-500 text-yellow-400' : 'bg-gray-800 border-gray-700 disabled:opacity-50'}`}
                title="Torch"
              >
                <Zap size={16} />
                <span className="text-[10px]">Flash</span>
              </button>
            </div>

             {/* Mirror Toggle */}
             <button 
                  onClick={() => handleImageChange('mirror', !imageSettings.mirror)}
                  className={`w-full py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 ${imageSettings.mirror ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  <FlipHorizontal size={14} /> Mirror Camera (Selfie Mode)
            </button>

            {/* Basic Source Settings */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                 <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Camera</label>
                    <select 
                      value={settings.deviceId}
                      onChange={(e) => onSettingsChange({...settings, deviceId: e.target.value})}
                      className="w-full bg-black border border-gray-800 rounded p-2 text-xs focus:border-red-500 outline-none"
                    >
                      {devices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                      ))}
                    </select>
                 </div>
                 <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                      {settings.audioDeviceId ? <Mic size={10} className="text-green-500"/> : <MicOff size={10} className="text-red-500"/>} Audio
                    </label>
                    <select 
                      value={settings.audioDeviceId || ''}
                      onChange={(e) => onSettingsChange({...settings, audioDeviceId: e.target.value})}
                      className="w-full bg-black border border-gray-800 rounded p-2 text-xs focus:border-red-500 outline-none"
                    >
                      <option value="">Muted</option>
                      {audioDevices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                      ))}
                    </select>
                 </div>
              </div>
            </div>

            {/* Saturation Control (Software) */}
             <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1"><Droplets size={12}/> Saturation</div>
                  <span>{imageSettings.saturation.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1"
                  value={imageSettings.saturation}
                  onChange={(e) => handleImageChange('saturation', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

            {/* Hardware Pro Controls - Always Rendered */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2 mb-2">
                <Aperture size={14} /> Hardware Pro
              </div>
              
              {/* Background Blur */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                        <UserRound size={16} className={bgBlur ? "text-purple-400" : "text-gray-500"} />
                        <span className="text-xs font-bold">Portrait Blur</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newState = !bgBlur;
                        setBgBlur(newState);
                        onToggleBackgroundBlur(newState);
                      }}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${bgBlur ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >
                      {bgBlur ? "ON" : "OFF"}
                    </button>
                  </div>
                  
                  {/* Blur Depth Slider */}
                  <div className={`transition-all duration-300 ${bgBlur ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Depth</span>
                      <span>{blurDepth}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={blurDepth}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setBlurDepth(val);
                          // Try to apply custom constraint if supported by some browser variations
                          onApplyConstraint('backgroundBlurAmount', val); 
                        }}
                        className="w-full h-1 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
              </div>

              {/* Focus Control */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-gray-300 font-bold uppercase tracking-wider">
                      <ScanEye size={16} className={autoFocus ? "text-green-500" : "text-white"} />
                      <span>Focus</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const newAutoState = !autoFocus;
                        setAutoFocus(newAutoState);
                        if (newAutoState) {
                            onApplyConstraint('focusMode', 'continuous');
                        } else {
                            onApplyConstraint('focusMode', 'manual');
                            onApplyConstraint('focusDistance', focusDistance);
                        }
                      }}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                        autoFocus 
                          ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {autoFocus ? "AUTO" : "MANUAL"}
                    </button>
                  </div>

                  <div className={`transition-all duration-300 ${autoFocus ? 'opacity-40 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono uppercase">
                        <span>Macro</span>
                        <span className={autoFocus ? "text-gray-500" : "text-white"}>{focusDistance.toFixed(2)}</span>
                        <span>Infinity</span>
                      </div>
                      <input 
                      type="range" 
                      {...getCapRange('focusDistance', {min: 0, max: 10, step: 0.1})}
                      value={focusDistance}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFocusDistance(val);
                        if (autoFocus) {
                            setAutoFocus(false); 
                            onApplyConstraint('focusMode', 'manual');
                        }
                        onApplyConstraint('focusDistance', val);
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

              {/* Exposure Control */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-gray-300 font-bold uppercase tracking-wider">
                      <SunMedium size={16} className={autoExposure ? "text-green-500" : "text-white"} />
                      <span>Exposure</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!autoExposure && <span className="text-white font-mono text-[10px] bg-black px-1 rounded">{exposure.toFixed(1)}</span>}
                        <button 
                          onClick={() => {
                            onApplyConstraint('exposureMode', 'continuous');
                            setExposure(0);
                            setAutoExposure(true);
                          }}
                          className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${autoExposure ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-gray-700 text-gray-400'}`}
                        >
                          AUTO
                        </button>
                    </div>
                  </div>
                  <div className={`transition-all duration-300 ${autoExposure ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <input 
                      type="range" 
                      {...getCapRange('exposureCompensation', {min: -2, max: 2, step: 0.1})}
                      value={exposure}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setExposure(val);
                        setAutoExposure(false);
                        onApplyConstraint('exposureCompensation', val);
                        onApplyConstraint('exposureMode', 'manual'); 
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                  </div>
                </div>

              {/* ISO Control */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-gray-300 font-bold uppercase tracking-wider">
                      <Aperture size={16} className={autoIso ? "text-green-500" : "text-white"} />
                      <span>ISO</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!autoIso && <span className="text-white font-mono text-[10px] bg-black px-1 rounded">{iso}</span>}
                        <button 
                          onClick={() => {
                            onApplyConstraint('exposureMode', 'continuous');
                            setAutoIso(true);
                          }}
                          className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${autoIso ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-gray-700 text-gray-400'}`}
                        >
                          AUTO
                        </button>
                    </div>
                  </div>
                  <div className={`transition-all duration-300 ${autoIso ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <input 
                      type="range" 
                      {...getCapRange('iso', {min: 100, max: 1600, step: 100})}
                      value={iso}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setIso(val);
                        setAutoIso(false);
                        onApplyConstraint('iso', val);
                        onApplyConstraint('exposureMode', 'manual');
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

              {/* WB Control */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-gray-300 font-bold uppercase tracking-wider">
                      <Thermometer size={16} className={autoWb ? "text-green-500" : "text-white"} />
                      <span>White Balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!autoWb && <span className="text-white font-mono text-[10px] bg-black px-1 rounded">{wb}K</span>}
                        <button 
                          onClick={() => {
                            onApplyConstraint('whiteBalanceMode', 'continuous');
                            setAutoWb(true);
                          }}
                          className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${autoWb ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-gray-700 text-gray-400'}`}
                        >
                          AUTO
                        </button>
                    </div>
                  </div>
                  <div className={`transition-all duration-300 ${autoWb ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-400">Cool</span>
                        <input 
                        type="range" 
                        {...getCapRange('colorTemperature', {min: 2500, max: 6500, step: 50})}
                        value={wb}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setWb(val);
                          setAutoWb(false);
                          onApplyConstraint('whiteBalanceMode', 'manual');
                          onApplyConstraint('colorTemperature', val);
                        }}
                        className="w-full h-2 bg-gradient-to-r from-blue-500 via-white to-orange-500 rounded-lg appearance-none cursor-pointer"
                      />
                        <span className="text-[10px] text-orange-400">Warm</span>
                    </div>
                  </div>
                </div>
            </div>

            {/* Zoom Control - Always Rendered */}
            <div className="space-y-1 pt-2 border-t border-gray-800">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex justify-between">
                <span>Digital Zoom</span>
                <span>{zoomLevel.toFixed(1)}x</span>
              </label>
              <input 
                type="range" 
                {...getCapRange('zoom', {min: 1, max: 3, step: 0.1})}
                value={zoomLevel}
                onChange={(e) => {
                  const z = parseFloat(e.target.value);
                  onZoom(z);
                }}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Connection Controls */}
        {activeTab === 'connect' && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
               <div className="flex items-center gap-2 mb-3">
                <Wifi className="text-green-400" size={20} />
                <h3 className="font-bold text-sm">WiFi Connection</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                To connect this camera to OBS or vMix via WiFi:
              </p>
              
              <ol className="list-decimal list-inside text-xs text-gray-300 space-y-2 mb-4">
                <li>Ensure PC and Phone are on same WiFi.</li>
                <li>Add a <strong>Browser Source</strong> in OBS.</li>
                <li>Enter the URL below (replace IP).</li>
                <li>Set Width: 1920, Height: 1080.</li>
                <li>Control FPS is <strong>Checked</strong>.</li>
              </ol>

              <div className="bg-black p-2 rounded border border-gray-700 flex items-center justify-between mb-2">
                <code className="text-xs text-green-500 truncate mr-2">
                  {window.location.protocol}//{localIp}/?clean=true
                </code>
                <button onClick={handleCopyUrl} className="text-gray-400 hover:text-white">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tally Light</label>
              <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800">
                <span className="text-sm">Show Red Border (On Air)</span>
                <button 
                  onClick={() => onBroadcastChange({ showTally: !broadcastState.showTally })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${broadcastState.showTally ? 'bg-red-600' : 'bg-gray-700'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${broadcastState.showTally ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="text-blue-400" size={18} />
                <h3 className="font-bold text-sm">USB Connection</h3>
              </div>
              <p className="text-xs text-gray-400">
                For zero latency, connect via USB and use a <strong>Screen Mirroring</strong> tool (like scrcpy) + Window Capture.
              </p>
            </div>
          </div>
        )}

        {/* AI Studio Controls */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Aperture className="text-blue-400" size={20} />
                <h3 className="font-bold text-sm">Video Doctor</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Let Gemini analyze your shot for lighting and composition.
              </p>
              <button 
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded text-sm font-medium transition-colors"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Current Frame"}
              </button>

              {analysisResult && (
                <div className="mt-4 space-y-3 text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="bg-gray-800 p-2 rounded">
                    <span className="text-blue-400 font-bold text-xs uppercase block">Lighting</span>
                    {analysisResult.lighting}
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <span className="text-blue-400 font-bold text-xs uppercase block">Composition</span>
                    {analysisResult.composition}
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <span className="text-blue-400 font-bold text-xs uppercase block">Video Quality</span>
                    {analysisResult.quality}
                  </div>
                  <div className="bg-gray-800 p-2 rounded border border-blue-500/30">
                    <span className="text-blue-400 font-bold text-xs uppercase block mb-1">Fixes & Solutions</span>
                    <div className="whitespace-pre-line text-xs/5">
                      {analysisResult.advice}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-purple-400" size={20} />
                <h3 className="font-bold text-sm">GenAI Overlays</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Describe a graphic overlay (e.g., "Neon lower third")
              </p>
              <textarea 
                className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white mb-3 focus:border-purple-500 outline-none resize-none h-20"
                placeholder="E.g. Red 'Breaking News' banner..."
                value={overlayPrompt}
                onChange={(e) => setOverlayPrompt(e.target.value)}
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => onGenerateOverlay(overlayPrompt)}
                  disabled={isAnalyzing || !overlayPrompt}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded text-sm font-medium transition-colors"
                >
                  Generate
                </button>
                {overlayActive && (
                  <button 
                    onClick={onClearOverlay}
                    className="px-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded border border-red-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-center">
        <p className="text-[10px] text-gray-600">
          CAM2PC v1.2
        </p>
      </div>
    </div>
  );
};

export default Controls;
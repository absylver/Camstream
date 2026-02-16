import React, { useState, useEffect } from 'react';
import { 
  Settings, Monitor, Sparkles, X, Aperture, Maximize2, Wifi, Zap, Battery, Link2, Copy, Check,
  SunMedium, Palette, Contrast, ScanEye, FlipHorizontal, Thermometer
} from 'lucide-react';
import { StreamSettings, VideoDevice, AIAnalysisResult, BroadcastState, ImageSettings } from '../types';

interface ControlsProps {
  settings: StreamSettings;
  onSettingsChange: (s: StreamSettings) => void;
  devices: VideoDevice[];
  capabilities: MediaTrackCapabilities | null;
  onZoom: (val: number) => void;
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
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  onApplyConstraint: (name: string, val: any) => void;
}

const Controls: React.FC<ControlsProps> = ({
  settings,
  onSettingsChange,
  devices,
  capabilities,
  onZoom,
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
  imageSettings,
  onImageSettingsChange,
  onApplyConstraint
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'camera' | 'connect' | 'ai'>('camera');
  const [overlayPrompt, setOverlayPrompt] = useState('');
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [localIp, setLocalIp] = useState("192.168.1.xxx");
  
  // Hardware control states (local UI state, syncing is harder without reading back, assuming success)
  const [iso, setIso] = useState<number>(0);
  const [exposure, setExposure] = useState<number>(0);
  const [focusDistance, setFocusDistance] = useState<number>(0);
  const [wb, setWb] = useState<number>(0);

  // Initialize ISO/Exposure from caps if possible? 
  // Browser doesn't easily give current values without track.getSettings(). 
  // For now we just use the sliders as relative controls or starting at min/center.

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

  const resetFilters = () => {
    onImageSettingsChange({
      brightness: 1,
      contrast: 1,
      saturation: 1,
      sepia: 0,
      mirror: imageSettings.mirror
    });
  };

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

  // Type guard helpers
  // @ts-ignore
  const supportsIso = capabilities && 'iso' in capabilities;
  // @ts-ignore
  const supportsExposure = capabilities && 'exposureCompensation' in capabilities;
  // @ts-ignore
  const supportsFocus = capabilities && 'focusDistance' in capabilities;
  // @ts-ignore
  const supportsWB = capabilities && 'colorTemperature' in capabilities;

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-black/85 backdrop-blur-xl border-l border-gray-800 text-white z-40 flex flex-col transition-transform">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Monitor className="text-red-500" /> StreamCast AI
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
          Gemini
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Camera Controls */}
        {activeTab === 'camera' && (
          <div className="space-y-6">
            
            {/* Quick Toggles */}
            <div className="grid grid-cols-4 gap-2">
               <button 
                onClick={onToggleCleanMode}
                className="col-span-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors text-xs"
              >
                <Maximize2 size={16} /> Clean
              </button>
               <button 
                onClick={() => onBroadcastChange({ isEcoMode: !broadcastState.isEcoMode })}
                className={`col-span-1 rounded-lg flex flex-col items-center justify-center p-2 border ${broadcastState.isEcoMode ? 'bg-green-900/40 border-green-500' : 'bg-gray-800 border-gray-700'}`}
              >
                <Battery size={16} />
              </button>
               <button 
                onClick={() => {
                  const newState = !broadcastState.isTorchOn;
                  onBroadcastChange({ isTorchOn: newState });
                  onToggleTorch(newState);
                }}
                disabled={!capabilities || !('torch' in capabilities)}
                className={`col-span-1 rounded-lg flex flex-col items-center justify-center p-2 border ${broadcastState.isTorchOn ? 'bg-yellow-900/40 border-yellow-500 text-yellow-400' : 'bg-gray-800 border-gray-700 disabled:opacity-50'}`}
              >
                <Zap size={16} />
              </button>
            </div>

            {/* Hardware Pro Controls */}
            {(supportsIso || supportsExposure || supportsFocus || supportsWB) && (
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Aperture size={14} /> Hardware Pro
                </div>
                
                {supportsExposure && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Exposure Comp</span>
                      <span>{exposure.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" 
                      min={(capabilities as any).exposureCompensation.min}
                      max={(capabilities as any).exposureCompensation.max}
                      step={(capabilities as any).exposureCompensation.step}
                      defaultValue={0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setExposure(val);
                        onApplyConstraint('exposureCompensation', val);
                        onApplyConstraint('exposureMode', 'manual'); // Ensure manual mode
                      }}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {supportsIso && (
                   <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>ISO</span>
                      <span>{iso}</span>
                    </div>
                    <input 
                      type="range" 
                      min={(capabilities as any).iso.min}
                      max={(capabilities as any).iso.max}
                      step={(capabilities as any).iso.step}
                      defaultValue={(capabilities as any).iso.min} // Start low usually
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setIso(val);
                        onApplyConstraint('iso', val);
                         onApplyConstraint('exposureMode', 'manual');
                      }}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {supportsWB && (
                   <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Temp (K)</span>
                      <span>{wb}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Thermometer size={14} className="text-blue-400" />
                       <input 
                        type="range" 
                        min={(capabilities as any).colorTemperature.min}
                        max={(capabilities as any).colorTemperature.max}
                        step={(capabilities as any).colorTemperature.step}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setWb(val);
                          onApplyConstraint('whiteBalanceMode', 'manual');
                          onApplyConstraint('colorTemperature', val);
                        }}
                        className="w-full h-1 bg-gradient-to-r from-blue-500 via-white to-orange-500 rounded-lg appearance-none cursor-pointer"
                      />
                       <Thermometer size={14} className="text-orange-400" />
                    </div>
                  </div>
                )}

                 {supportsFocus && (
                   <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Focus</span>
                      <span>{focusDistance.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScanEye size={14} />
                      <input 
                        type="range" 
                        min={(capabilities as any).focusDistance.min}
                        max={(capabilities as any).focusDistance.max}
                        step={(capabilities as any).focusDistance.step}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setFocusDistance(val);
                          onApplyConstraint('focusMode', 'manual');
                          onApplyConstraint('focusDistance', val);
                        }}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Software Studio Effects */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Palette size={14} /> Studio FX
                </div>
                <button onClick={resetFilters} className="text-[10px] text-red-400 hover:text-red-300">Reset</button>
              </div>

               {/* Brightness */}
               <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <SunMedium size={14} />
                  <span>Brightness</span>
                </div>
                <input 
                  type="range" min="0.5" max="2" step="0.05"
                  value={imageSettings.brightness}
                  onChange={(e) => handleImageChange('brightness', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

               {/* Contrast */}
               <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <Contrast size={14} />
                  <span>Contrast</span>
                </div>
                <input 
                  type="range" min="0.5" max="2" step="0.05"
                  value={imageSettings.contrast}
                  onChange={(e) => handleImageChange('contrast', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Saturation */}
               <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <Palette size={14} />
                  <span>Saturation</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.05"
                  value={imageSettings.saturation}
                  onChange={(e) => handleImageChange('saturation', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Sepia/Warmth */}
               <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <Thermometer size={14} />
                  <span>Warmth</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={imageSettings.sepia}
                  onChange={(e) => handleImageChange('sepia', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

               {/* Mirror Toggle */}
               <button 
                  onClick={() => handleImageChange('mirror', !imageSettings.mirror)}
                  className={`w-full py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 ${imageSettings.mirror ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  <FlipHorizontal size={14} /> Mirror Camera
               </button>

            </div>

             {/* Basic Source Settings */}
             <div className="space-y-2 pt-2 border-t border-gray-800">
              <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Source & Res</label>
              <select 
                value={settings.deviceId}
                onChange={(e) => onSettingsChange({...settings, deviceId: e.target.value})}
                className="w-full bg-black border border-gray-800 rounded p-2 text-xs focus:border-red-500 outline-none"
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
               <div className="grid grid-cols-3 gap-2 mt-2">
                {['4k', '1080p', '720p'].map((res) => (
                  <button
                    key={res}
                    onClick={() => onSettingsChange({...settings, resolution: res as any})}
                    className={`p-1 rounded text-[10px] border ${settings.resolution === res ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-gray-800 text-gray-500'}`}
                  >
                    {res.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Control */}
            {capabilities && 'zoom' in capabilities && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex justify-between">
                  <span>Digital Zoom</span>
                  <span>{zoom.toFixed(1)}x</span>
                </label>
                <input 
                  type="range" 
                  min={1} 
                  max={(capabilities as any).zoom?.max || 3} 
                  step={0.1} 
                  value={zoom}
                  onChange={(e) => {
                    const z = parseFloat(e.target.value);
                    setZoom(z);
                    onZoom(z);
                  }}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
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
                <h3 className="font-bold text-sm">Stream Doctor</h3>
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
                  <div className="bg-gray-800 p-2 rounded border border-blue-500/30">
                    <span className="text-blue-400 font-bold text-xs uppercase block">Pro Tip</span>
                    {analysisResult.advice}
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
          StreamCast AI v1.2
        </p>
      </div>
    </div>
  );
};

export default Controls;
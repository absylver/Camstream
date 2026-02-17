import { useState, useEffect, useCallback, useRef } from 'react';
import { StreamSettings, VideoDevice, AudioDevice } from '../types';

export const useMediaStream = (settings: StreamSettings) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [capabilities, setCapabilities] = useState<MediaTrackCapabilities | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        
        const vDevs = devs
          .filter(d => d.kind === 'videoinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}...` }));
        setVideoDevices(vDevs);

        const aDevs = devs
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}...` }));
        setAudioDevices(aDevs);

      } catch (err) {
        console.error("Error enumerating devices", err);
      }
    };
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    getDevices();
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  // Start Stream
  useEffect(() => {
    const startStream = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const width = settings.resolution === '4k' ? 3840 : settings.resolution === '1080p' ? 1920 : 1280;
      const height = settings.resolution === '4k' ? 2160 : settings.resolution === '1080p' ? 1080 : 720;

      // Only request audio if a device ID is selected (non-empty string)
      const audioConstraint = settings.audioDeviceId 
        ? { deviceId: { exact: settings.audioDeviceId } } 
        : false;

      const constraints: MediaStreamConstraints = {
        audio: audioConstraint, 
        video: {
          deviceId: settings.deviceId ? { exact: settings.deviceId } : undefined,
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: settings.frameRate }
        }
      };

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        streamRef.current = newStream;
        setError(null);

        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
           setCapabilities(videoTrack.getCapabilities());
        }

      } catch (err) {
        console.error("Error accessing camera/microphone:", err);
        setError("Could not access devices. Please check permissions.");
      }
    };

    startStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [settings.deviceId, settings.audioDeviceId, settings.resolution, settings.frameRate]);

  const applyZoom = useCallback(async (zoomLevel: number) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    
    // Try advanced constraints
    try {
      await track.applyConstraints({
        advanced: [{ zoom: zoomLevel } as any]
      });
    } catch (e) {
      console.error("Zoom failed", e);
    }
  }, []);

  const toggleTorch = useCallback(async (on: boolean) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    
    // Try advanced constraints
    try {
      await track.applyConstraints({
        advanced: [{ torch: on } as any]
      });
    } catch (e) {
      console.error("Torch failed", e);
    }
  }, []);

  const toggleBackgroundBlur = useCallback(async (on: boolean) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    
    // Try advanced first (common for newer features)
    try {
      // @ts-ignore
      await track.applyConstraints({ advanced: [{ backgroundBlur: on }] });
    } catch (e) {
       console.warn(`Advanced blur failed, trying top-level...`);
       try {
          // Fallback to top-level constraint
          // @ts-ignore
          await track.applyConstraints({ backgroundBlur: on });
       } catch(e2) {
           console.error("Blur failed to apply", e2);
       }
    }
  }, []);

  const applyConstraint = useCallback(async (constraintName: string, value: any) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    
    try {
        // Try advanced first (often needed for ISO/Exposure/FocusMode)
        await track.applyConstraints({
            advanced: [{ [constraintName]: value } as any]
        });
    } catch (e) {
        console.warn(`Advanced constraint ${constraintName} failed, trying top-level...`);
        try {
            // Fallback to top-level constraint
             await track.applyConstraints({
                [constraintName]: value
            } as any);
        } catch (e2) {
             console.error(`Failed to apply ${constraintName}`, e2);
        }
    }
  }, []);

  return { stream, error, videoDevices, audioDevices, capabilities, applyZoom, toggleTorch, toggleBackgroundBlur, applyConstraint };
};
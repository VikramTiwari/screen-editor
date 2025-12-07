import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { getRandomBackground } from '../utils/backgrounds';

// Default Settings
const defaultSettings = {
  ...getRandomBackground(),
  layoutMode: 'default',
  padding: 40,
  borderRadius: 12,
  shadow: 20,
  showScreen: true,
  showCamera: true,
  showInteractions: true,
  cameraSize: 200,
  cameraPosition: 'bottom-left',
  cameraShape: 'rectangle',
  cameraBorderRadius: 12,
  cameraShadow: 20,
  audioOffset: 0, // In seconds, positive means audio plays later (delayed), negative means audio plays earlier
};

export const useEditorState = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // UX State
  const [hoverTime, setHoverTime] = useState(null);
  const [selectionRange, setSelectionRange] = useState(null); // { start, end }

  // Data Model
  // Base Settings: The default settings for the entire video
  const [baseSettings, setBaseSettings] = useState({ ...defaultSettings });
  
  // Overrides: Array<{ id: string, start: number, end: number, settings: object }>
  // These are sparse overrides that override the base settings
  const [overrides, setOverrides] = useState([]);
  const [selectedOverrideId, setSelectedOverrideId] = useState(null);

  const screenRef = useRef(null);
  const audioRef = useRef(null);
  const cameraRef = useRef(null);



  // Derived State: timelineData (for Canvas and Export compatibility)
  const timelineData = useMemo(() => {
      if (duration === 0) return [];
      
      const data = new Array(Math.ceil(duration)).fill(null);
      
      for (let i = 0; i < data.length; i++) {
          // Find if there is an active override for this second
          // If multiple overrides overlap, the last one in the array takes precedence
          const activeOverride = overrides.find(o => i >= o.start && i < o.end);
          
          const currentSettings = activeOverride ? { ...baseSettings, ...activeOverride.settings } : baseSettings;
          
          data[i] = {
              screen: currentSettings.showScreen ?? true,
              camera: currentSettings.showCamera ?? true,
              audio: (currentSettings.showScreen ?? true) || (currentSettings.showCamera ?? true),
              interactions: currentSettings.showInteractions ?? true,
              settings: currentSettings
          };
      }
      
      return data;
  }, [duration, overrides, baseSettings]);

  const getCurrentFrameData = () => {
      const time = hoverTime !== null ? hoverTime : currentTime;
      const activeOverride = overrides.find(o => time >= o.start && time < o.end);
      const settings = activeOverride ? { ...baseSettings, ...activeOverride.settings } : baseSettings;
      
      return {
          screen: settings.showScreen ?? true,
          camera: settings.showCamera ?? true,
          audio: true,
          interactions: settings.showInteractions ?? true,
          settings: settings
      };
  };

  const currentFrame = getCurrentFrameData();

  const getCurrentLayoutMode = () => {
    if (currentFrame.screen && currentFrame.camera) return 'composition';
    if (currentFrame.screen) return 'full-screen';
    if (currentFrame.camera) return 'full-camera';
    return 'hidden';
  };

  const currentSettings = currentFrame.settings || defaultSettings;

  // Settings for the Properties Panel
  const getPropertiesPanelSettings = () => {
      if (selectedOverrideId) {
          const override = overrides.find(o => o.id === selectedOverrideId);
          if (override) return override.settings;
      }
      return baseSettings;
  };
  
  const propertiesPanelSettings = getPropertiesPanelSettings();

  const getSelectionVisibility = () => {
      const settings = getPropertiesPanelSettings();
      return { 
          screen: settings.showScreen ?? true, 
          camera: settings.showCamera ?? true 
      };
  };

  const selectionVisibility = getSelectionVisibility();

  // Actions


  const handleSettingsChange = useCallback((newSettings) => {
      if (selectedOverrideId) {
          // Update specific override
          setOverrides(prev => prev.map(o => {
              if (o.id === selectedOverrideId) {
                  return { ...o, settings: { ...o.settings, ...newSettings } };
              }
              return o;
          }));
      } else {
          // Update base settings
          setBaseSettings(prev => ({ ...prev, ...newSettings }));
      }
  }, [selectedOverrideId]);

  const handleVisibilityChange = (type, value) => {
      const settingKey = type === 'screen' ? 'showScreen' : 'showCamera';
      handleSettingsChange({ [settingKey]: value });
  };

  const togglePlay = (isExporting) => {
    if (isExporting) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    const offset = baseSettings.audioOffset || 0;

    [screenRef, audioRef, cameraRef].forEach(ref => {
      if (ref.current) {
        if (ref.current.play) {
            if (nextState) {
                // Determine start time for this element
                // For video: currentTime
                // For audio: currentTime - offset
                
                if (ref === audioRef) {
                     ref.current.currentTime = Math.max(0, currentTime - offset);
                } else {
                     // For video refs, they might use internal seek or just play
                     // If using HTML5 video, we might want to ensure sync
                     if (ref.current.currentTime !== undefined) {
                         // Double check sync
                     }
                }
                
                const playPromise = ref.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Ignore AbortError which happens when pausing while loading or playing
                        if (error.name === 'NotAllowedError') {
                             console.warn("Playback failed due to autoplay policy. User interaction required.", error);
                             setIsPlaying(false);
                        } else if (error.name !== 'AbortError') {
                             console.error("Playback failed", error);
                        }
                    });
                }
            } else {
                ref.current.pause();
            }
        }
      }
    });
  };

  const handleTimeUpdate = (isExporting) => {
    if (isExporting) return;
    if (screenRef.current) {
        const time = screenRef.current.getCurrentTime();
        setCurrentTime(time);
        
        // Continuous Sync Check for Audio
        // If we drift too much, snap back.
        // Doing this every frame might be jittery, but let's check.
        // We trust screenRef as the master clock.
        
        if (isPlaying && audioRef.current) {
             const offset = baseSettings.audioOffset || 0;
             const expectedAudioTime = Math.max(0, time - offset);
             if (Math.abs(audioRef.current.currentTime - expectedAudioTime) > 0.3) {
                 audioRef.current.currentTime = expectedAudioTime;
             }
        }
    }
  };

  const handleLoadedMetadata = () => {
      if (screenRef.current) {
          const dur = screenRef.current.getDuration();
          setDuration(dur);
          
          // Initialize overrides if empty
          if (overrides.length === 0 && dur > 0) {
            // No initial override needed, baseSettings covers the whole duration
          }
      }
  };

  const handleHover = (time) => {
      setHoverTime(time);
      const targetTime = time !== null ? time : currentTime;
      const offset = baseSettings.audioOffset || 0;
      
      [screenRef, audioRef, cameraRef].forEach(ref => {
          if (ref.current) {
              let t = targetTime;
              if (ref === audioRef) {
                  t = Math.max(0, targetTime - offset);
              }
              
              if (typeof ref.current.seek === 'function') {
                  ref.current.seek(t);
              } else {
                  ref.current.currentTime = t;
              }
          }
      });
  };

  const handleSeek = (time, isExporting) => {
      if (isExporting) return;
      setCurrentTime(time);
      const offset = baseSettings.audioOffset || 0;
      
      [screenRef, audioRef, cameraRef].forEach(ref => {
          if (ref.current) {
              let t = time;
              if (ref === audioRef) {
                  t = Math.max(0, time - offset);
              }

              if (typeof ref.current.seek === 'function') {
                  ref.current.seek(t);
              } else {
                  ref.current.currentTime = t;
              }
          }
      });
  };

  // Split/Override State
  const [pendingOverrideStart, setPendingOverrideStart] = useState(null);

  const markOverrideStart = useCallback(() => {
      setPendingOverrideStart(currentTime);
      setSelectionRange(null);
  }, [currentTime]);

  const completeOverride = useCallback(() => {
      if (pendingOverrideStart === null) return;

      const start = Math.min(pendingOverrideStart, currentTime);
      const end = Math.max(pendingOverrideStart, currentTime);

      if (Math.abs(end - start) < 0.1) {
          console.warn("Override range too small");
          setPendingOverrideStart(null);
          return;
      }

      // Create new override
      // Initialize with current base settings to ensure continuity, or maybe defaults?
      // Let's initialize with base settings so it feels like a "snapshot" that can be modified.
      const newOverride = {
          id: crypto.randomUUID(),
          start,
          end,
          settings: { ...baseSettings, name: `OR-${start.toFixed(1)}-${end.toFixed(1)}` }
      };

      setOverrides(prev => {
          const result = [];
          const { start: newStart, end: newEnd } = newOverride;

          for (const existing of prev) {
              // No overlap
              if (existing.end <= newStart || existing.start >= newEnd) {
                  result.push(existing);
                  continue;
              }

              // Overlap found - trim/split existing

              // 1. Pre-segment (if existing starts before new one)
              if (existing.start < newStart) {
                  result.push({
                      ...existing,
                      end: newStart,
                      // Keep original ID for the first segment to minimize re-renders if possible, or new ID?
                      // Let's keep ID for stability if it's the "main" part, but effectively it's modified.
                  });
              }

              // 2. Post-segment (if existing ends after new one)
              if (existing.end > newEnd) {
                  result.push({
                      ...existing,
                      id: crypto.randomUUID(), // New ID for the split part
                      start: newEnd
                  });
              }

              // If existing is fully inside [newStart, newEnd], it is dropped.
          }

          // Add the new override
          result.push(newOverride);

          // Sort by start time
          return result.sort((a, b) => a.start - b.start);
      });

      setSelectionRange({ start, end });
      setSelectedOverrideId(newOverride.id);
      setPendingOverrideStart(null);
  }, [pendingOverrideStart, currentTime, baseSettings]);

  const cancelOverride = useCallback(() => {
      setPendingOverrideStart(null);
  }, []);

  const deleteOverride = useCallback((id) => {
      setOverrides(prev => prev.filter(o => o.id !== id));
      if (selectedOverrideId === id) {
          setSelectedOverrideId(null);
      }
  }, [selectedOverrideId]);

  // Mute audio if audio track is not active
  useEffect(() => {
      if (audioRef.current) {
          const shouldPlay = currentFrame.audio;
          audioRef.current.muted = !shouldPlay;
      }
  }, [currentFrame.audio]);




  const applyAutoZoomOverrides = useCallback((newOverrides) => {
      setOverrides(prev => {
          // Filter out duplicates
          const uniqueNewOverrides = newOverrides.filter(newOverride => {
              return !prev.some(existingOverride => 
                  Math.abs(existingOverride.start - newOverride.start) < 0.01 &&
                  Math.abs(existingOverride.end - newOverride.end) < 0.01 &&
                  existingOverride.settings.name === newOverride.settings.name
              );
          });
          
          if (uniqueNewOverrides.length === 0) return prev;
          
          return [...prev, ...uniqueNewOverrides];
      });
  }, []);

  // Focal Point Mode
  const [isSettingFocalPoint, setIsSettingFocalPoint] = useState(false);

  const toggleFocalPointMode = useCallback(() => {
      setIsSettingFocalPoint(prev => !prev);
  }, []);

  const handleFocalPointChange = useCallback((x, y) => {
      handleSettingsChange({ 
          focalPointX: Math.round(x), 
          focalPointY: Math.round(y) 
      });
      setIsSettingFocalPoint(false);
  }, [handleSettingsChange]);

  return {
      isPlaying,
      currentTime,
      duration,
      hoverTime,
      selectionRange,
      setSelectionRange,
      overrides,
      baseSettings,
      selectedOverrideId,
      setSelectedOverrideId,
      timelineData,
      currentFrame,
      currentSettings,
      getCurrentLayoutMode,
      propertiesPanelSettings,
      selectionVisibility,
      screenRef,
      audioRef,
      cameraRef,
      pendingOverrideStart,
      markOverrideStart,
      completeOverride,
      cancelOverride,
      deleteOverride,
      handleSettingsChange,
      handleVisibilityChange,
      togglePlay,
      handleTimeUpdate,
      handleLoadedMetadata,
      handleHover,
      handleSeek,
      applyAutoZoomOverrides,
      setOverrides,
      setBaseSettings,
      isSettingFocalPoint,
      toggleFocalPointMode,
      handleFocalPointChange
  };
};

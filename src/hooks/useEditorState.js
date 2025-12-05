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
          
          const currentSettings = activeOverride ? activeOverride.settings : baseSettings;
          
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
      const settings = activeOverride ? activeOverride.settings : baseSettings;
      
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


  const handleSettingsChange = (newSettings) => {
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
  };

  const handleVisibilityChange = (type, value) => {
      const settingKey = type === 'screen' ? 'showScreen' : 'showCamera';
      handleSettingsChange({ [settingKey]: value });
  };

  const togglePlay = (isExporting) => {
    if (isExporting) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    [screenRef, audioRef, cameraRef].forEach(ref => {
      if (ref.current) {
        if (ref.current.play) {
            nextState ? ref.current.play() : ref.current.pause();
        }
      }
    });
  };

  const handleTimeUpdate = (isExporting) => {
    if (isExporting) return;
    if (screenRef.current) {
        setCurrentTime(screenRef.current.getCurrentTime());
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
      if (time !== null) {
          [screenRef, audioRef, cameraRef].forEach(ref => {
              if (ref.current) {
                  if (typeof ref.current.seek === 'function') {
                      ref.current.seek(time);
                  } else {
                      ref.current.currentTime = time;
                  }
              }
          });
      } else {
          [screenRef, audioRef, cameraRef].forEach(ref => {
              if (ref.current) {
                  if (typeof ref.current.seek === 'function') {
                      ref.current.seek(currentTime);
                  } else {
                      ref.current.currentTime = currentTime;
                  }
              }
          });
      }
  };

  const handleSeek = (time, isExporting) => {
      if (isExporting) return;
      setCurrentTime(time);
      [screenRef, audioRef, cameraRef].forEach(ref => {
          if (ref.current) {
              if (typeof ref.current.seek === 'function') {
                  ref.current.seek(time);
              } else {
                  ref.current.currentTime = time;
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
          // TODO: Handle overlaps? For now, we just add it. 
          // Ideally we should trim existing overrides that overlap with this new one.
          // But simple "layering" might be enough if we sort or prioritize.
          // Let's just add it.
          return [...prev, newOverride];
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
      handleSeek
  };
};

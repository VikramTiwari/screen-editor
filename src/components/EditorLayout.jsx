import React, { useRef, useState, useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import Timeline from './Timeline';
import EditorHeader from './EditorHeader';
import { Play, Pause } from 'lucide-react';
import { useRecordingLoader } from '../hooks/useRecordingLoader';
import { useEditorState } from '../hooks/useEditorState';
import { useVideoExport } from '../hooks/useVideoExport';
import { useAutoSave } from '../hooks/useAutoSave';
import YouTubeMock from './YouTubeMock';

const DEFAULT_SETTINGS = {
  showScreen: true,
  showCamera: true,
  cameraSize: 300,
  cameraPosition: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  backgroundType: 'gradient', // 'solid', 'gradient', 'image'
  backgroundColor: '#000000',
  backgroundGradient: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
  backgroundImage: null,
  padding: 40,
  borderRadius: 20,
  shadow: true
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const EditorLayout = () => {
  const { camera, screen, audio, interactions, loading, error } = useRecordingLoader();
  const { isExporting, progress, startExport } = useVideoExport();
  
  const {
      isPlaying,
      currentTime,
      duration,
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
      setBaseSettings
  } = useEditorState({
      defaultSettings: DEFAULT_SETTINGS
  });

  // Load config on startup
  useEffect(() => {
      const loadConfig = async () => {
          try {
              const res = await fetch('/demo/config.json');
              if (res.ok) {
                  const config = await res.json();
                  if (config.baseSettings) {
                      setBaseSettings(prev => ({ ...prev, ...config.baseSettings }));
                  }
                  if (config.overrides) {
                      setOverrides(config.overrides);
                  }
                  console.log("Loaded config from /demo/config.json");
              }
          } catch (e) {
              console.log("No existing config found or failed to load", e);
          }
      };
      loadConfig();
  }, [setBaseSettings, setOverrides]);

  // Auto-save
  useAutoSave({ baseSettings, overrides }, '/api/save-config', 2000);

  const handleAutoZoom = useCallback(async () => {
      if (!interactions) return;
      
      // Dynamic import to avoid circular dependencies or large bundle if not used
      const { generateZoomOverrides } = await import('../utils/autoZoom');
      
      // Fetch interactions if it's a URL (which it is in the demo)
      let interactionsData = [];
      if (typeof interactions === 'string') {
          try {
              const res = await fetch(interactions);
              interactionsData = await res.json();
          } catch (e) {
              console.error("Failed to load interactions for auto-zoom", e);
              return;
          }
      } else {
          interactionsData = interactions;
      }

      const newOverrides = generateZoomOverrides(
        interactionsData, 
        duration, 
        screenRef.current?.videoWidth || 1920, 
        screenRef.current?.videoHeight || 1080
      );
      applyAutoZoomOverrides(newOverrides);
  }, [interactions, duration, applyAutoZoomOverrides]);

  // Auto-generate zoom overrides when interactions are loaded
  useEffect(() => {
      if (interactions && duration > 0) {
          // Check if we already have auto-zoom overrides to avoid re-generating?
          // For now, just run it once.
          handleAutoZoom();
      }
  }, [interactions, duration, handleAutoZoom]);

  const [panelWidth, setPanelWidth] = useState(320);
  const [timelineHeight, setTimelineHeight] = useState(450);
  const [viewMode, setViewMode] = useState('studio');
  const isDraggingPanel = useRef(false);
  const isDraggingTimeline = useRef(false);

  // ... (rest of resizing logic same) ...

  const handlePanelResizeStart = useCallback((e) => {
      e.preventDefault();
      isDraggingPanel.current = true;
      document.body.style.cursor = 'col-resize';
  }, []);

  const handleTimelineResizeStart = useCallback((e) => {
      e.preventDefault();
      isDraggingTimeline.current = true;
      document.body.style.cursor = 'row-resize';
  }, []);

  useEffect(() => {
      const handleMouseMove = (e) => {
          if (isDraggingPanel.current) {
              const newWidth = Math.max(250, Math.min(600, e.clientX));
              setPanelWidth(newWidth);
          }
          if (isDraggingTimeline.current) {
              const newHeight = Math.max(150, Math.min(600, window.innerHeight - e.clientY));
              setTimelineHeight(newHeight);
          }
      };

      const handleMouseUp = () => {
          isDraggingPanel.current = false;
          isDraggingTimeline.current = false;
          document.body.style.cursor = 'default';
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, []);

  // Pass data to export hook
  useEffect(() => {
      if (isExporting) {
          // We need to pass the refs and data to the export hook
          // This part might need adjustment based on how useVideoExport is implemented
          // For now, assuming it uses the refs directly or we pass them here
      }
  }, [isExporting]);

  const handleExport = useCallback(async () => {
      const screenVideo = screenRef.current?.getVideoElement();
      const cameraVideo = cameraRef.current?.getVideoElement();
      const audio = audioRef.current;

      // Load interactions data
      let interactionsData = [];
      if (interactions) {
          if (typeof interactions === 'string') {
              try {
                  const res = await fetch(interactions);
                  interactionsData = await res.json();
              } catch (e) {
                  console.error("Failed to load interactions for export", e);
              }
          } else {
              interactionsData = interactions;
          }
      }

      startExport({
          screenVideo,
          cameraVideo,
          audioElement: audio,
          baseSettings,
          overrides,
          duration,
          interactionsData, // Pass data
          onComplete: () => {
              console.log("Export complete");
          }
      });
  }, [screenRef, cameraRef, audioRef, startExport, baseSettings, overrides, duration, interactions]);

  const handleSaveConfig = useCallback(() => {
      const config = {
          baseSettings,
          overrides
      };
      
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }, [baseSettings, overrides]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-900 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
      <div className="flex flex-col h-screen bg-neutral-900 text-white overflow-hidden">
          {/* Header */}
          <EditorHeader 
              isExporting={isExporting}
              exportProgress={progress}
              onExport={handleExport}
              onSave={handleSaveConfig}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
              {viewMode === 'youtube' ? (
                  <YouTubeMock
                      isPlaying={isPlaying}
                      onTogglePlay={() => togglePlay(isExporting)}
                      currentTime={currentTime}
                      duration={duration}
                  >
                       <Canvas 
                          ref={screenRef}
                          cameraRef={cameraRef}
                          videoSrc={screen}
                          cameraSrc={camera}
                          interactionsSrc={interactions}
                          showInteractions={currentFrame.interactions}
                          currentTime={currentTime}
                          settings={{
                              ...currentSettings,
                              layoutMode: getCurrentLayoutMode()
                          }}
                          onTimeUpdate={() => handleTimeUpdate(isExporting)}
                          onLoadedMetadata={handleLoadedMetadata}
                      />
                  </YouTubeMock>
              ) : (
                  <>
                    {/* Left Sidebar - Properties Panel */}
                    <div 
                        className="flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col"
                        style={{ width: panelWidth }}
                    >
                        <PropertiesPanel 
                            settings={propertiesPanelSettings}
                            onSettingsChange={handleSettingsChange}
                            selectionVisibility={selectionVisibility}
                            onVisibilityChange={handleVisibilityChange}
                            isBaseSettings={!selectedOverrideId}
                            disabled={isExporting}
                        />
                    </div>

                    {/* Resize Handle for Panel */}
                    <div
                        className={`w-3 -ml-1.5 cursor-col-resize transition-all z-20 flex items-center justify-center group ${isExporting ? 'pointer-events-none opacity-50' : 'hover:bg-blue-500/10'}`}
                        onMouseDown={!isExporting ? handlePanelResizeStart : undefined}
                    >
                        <div className="w-px h-full bg-neutral-800 group-hover:bg-blue-500 transition-colors" />
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 bg-neutral-950 flex items-center justify-center relative overflow-hidden">
                        <Canvas 
                            ref={screenRef}
                            cameraRef={cameraRef}
                            videoSrc={screen}
                            cameraSrc={camera}
                            interactionsSrc={interactions}
                            showInteractions={currentFrame.interactions}
                            currentTime={currentTime}
                            settings={{
                                ...currentSettings,
                                layoutMode: getCurrentLayoutMode()
                            }}
                            onTimeUpdate={() => handleTimeUpdate(isExporting)}
                            onLoadedMetadata={handleLoadedMetadata}
                        />
                    </div>
                  </>
              )}
          </div>

          {/* Audio Element (Always Rendered) */}
          <audio 
              ref={audioRef} 
              src={audio} 
              onTimeUpdate={() => handleTimeUpdate(isExporting)}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => togglePlay(isExporting)}
              className="hidden"
          />

          {viewMode === 'studio' && (
              <>
                {/* Resize Handle for Timeline */}
                <div
                    className={`h-1 cursor-row-resize transition-all z-10 ${isExporting ? 'pointer-events-none opacity-50' : 'hover:h-1.5 bg-neutral-800 hover:bg-blue-500'}`}
                    onMouseDown={!isExporting ? handleTimelineResizeStart : undefined}
                />

                {/* Bottom Timeline Area */}
                <div 
                    className="flex-shrink-0 bg-neutral-900 border-t border-neutral-800 flex flex-col"
                    style={{ height: timelineHeight }}
                >
                    {/* Timeline Controls Toolbar */}
                    <div className={`h-10 border-b border-neutral-800 flex items-center px-4 gap-2 bg-neutral-900 flex-shrink-0 ${isExporting ? 'pointer-events-none opacity-50' : ''}`}>
                        <button 
                            onClick={() => togglePlay(isExporting)}
                            className="p-1.5 hover:bg-neutral-800 rounded-md text-white transition-colors"
                            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        
                        <span className="text-xs font-mono text-neutral-500 w-10 text-right">{formatTime(currentTime)}</span>
                        <div className="h-4 w-px bg-neutral-800 mx-2" />
                        
                        <div className="h-4 w-px bg-neutral-800 mx-2" />
                        
                        {!pendingOverrideStart ? (
                            <button 
                                onClick={markOverrideStart}
                                className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
                                title="Start Override Range"
                            >
                                <div className="w-3 h-3 border-l border-current" /> Start Override
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={completeOverride}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-white transition-colors text-xs font-medium flex items-center gap-1 animate-pulse"
                                    title="Complete Override Range"
                                >
                                    <div className="w-3 h-3 border-r border-current" /> End Override
                                </button>
                                <button 
                                    onClick={cancelOverride}
                                    className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors text-xs font-medium"
                                    title="Cancel Override"
                                >
                                    Cancel
                                </button>
                            </>
                        )}

                        {selectedOverrideId && !pendingOverrideStart && (
                            <>
                                <div className="h-4 w-px bg-neutral-800 mx-2" />
                                <button 
                                    onClick={() => deleteOverride(selectedOverrideId)}
                                    className="p-1.5 hover:bg-red-900/50 text-red-500 hover:text-red-400 rounded-md transition-colors text-xs font-medium flex items-center gap-1"
                                    title="Delete Selected Override"
                                >
                                    <div className="w-3 h-3 border border-current rounded-sm flex items-center justify-center">
                                        <div className="w-1.5 h-px bg-current" />
                                    </div>
                                    Delete Override
                                </button>
                            </>
                        )}
                        <div className="flex-1" />
                        <span className="text-xs font-mono text-neutral-500 w-10">{formatTime(duration)}</span>
                    </div>

                    <div className="flex-1 min-h-0 relative">
                        <Timeline 
                            timelineData={timelineData}
                            duration={duration || 100}
                            currentTime={currentTime}
                            onSeek={(time) => handleSeek(time, isExporting)}
                            onHover={handleHover}
                            overrides={overrides}
                            baseSettings={baseSettings}
                            selectedOverrideId={selectedOverrideId}
                            onOverrideSelect={setSelectedOverrideId}
                            selectionRange={selectionRange}
                            onSelectionChange={setSelectionRange}
                            pendingOverrideStart={pendingOverrideStart}
                            disabled={isExporting}
                        />
                    </div>
                </div>
              </>
          )}
       </div>
  );
};

export default EditorLayout;

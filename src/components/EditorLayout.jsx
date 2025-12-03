import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Settings, Download } from 'lucide-react';
import { useRecordingLoader } from '../hooks/useRecordingLoader';
import VideoPlayer from './VideoPlayer';
import Canvas from './Canvas';
import InteractionVisualizer from './InteractionVisualizer';
import PropertiesPanel from './PropertiesPanel';
import { useVideoExport } from '../hooks/useVideoExport';

const EditorLayout = () => {
  const { camera, screen, audio, interactions, loading, error } = useRecordingLoader();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Canvas Settings
  const [settings, setSettings] = useState({
    backgroundColor: '#171717', // neutral-900
    padding: 40,
    borderRadius: 12,
    shadow: 20,
    showCamera: true,
    cameraSize: 200,
    cameraPosition: 'bottom-left',
    cameraShape: 'rectangle',
    cameraBorderRadius: 12,
    cameraShadow: 20
  });

  const screenRef = useRef(null);
  const audioRef = useRef(null);
  const cameraRef = useRef(null);

  const { isExporting, progress, startExport } = useVideoExport();

  // Helper to get raw video element from VideoPlayer ref
  // We need to update VideoPlayer to expose the video element via ref
  // Currently it exposes methods. We should add 'videoElement' getter.
  
  const handleExport = () => {
    // We need to access the underlying video elements
    // Since our refs are imperative handles, we need to ensure they expose the element
    // Let's assume we'll update VideoPlayer to expose 'getVideoElement'
    
    const screenVideo = screenRef.current?.getVideoElement();
    const cameraVideo = cameraRef.current?.getVideoElement();
    // Audio is a native <audio> element, so we access it directly
    const audioVideo = audioRef.current;

    if (screenVideo) {
        startExport({
            screenVideo,
            cameraVideo,
            audioElement: audioVideo,
            settings,
            duration,
            onComplete: () => {
                console.log('Export complete');
            }
        });
    }
  };

  const togglePlay = () => {
    if (isExporting) return; // Disable playback control during export
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    [screenRef, audioRef, cameraRef].forEach(ref => {
      if (ref.current) {
        nextState ? ref.current.play() : ref.current.pause();
      }
    });
  };

  const handleSeek = (e) => {
    if (isExporting) return;
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    [screenRef, audioRef, cameraRef].forEach(ref => {
        if (ref.current) ref.current.seek(time);
    });
  };

  const handleTimeUpdate = () => {
    if (isExporting) return; // Don't update UI time during export to avoid jitter
    if (screenRef.current) {
        setCurrentTime(screenRef.current.getCurrentTime());
    }
  };

  const handleLoadedMetadata = () => {
      if (screenRef.current) {
          setDuration(screenRef.current.getDuration());
      }
  };

  const formatTime = (time) => {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white font-sans relative">
      {/* Export Overlay */}
      {isExporting && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold mb-4">Exporting Video...</div>
            <div className="w-96 h-4 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-600 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="mt-2 text-neutral-400">{Math.round(progress)}%</div>
        </div>
      )}

      {/* Header */}
      <header className="h-14 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-950 z-10">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">S</div>
            <h1 className="font-bold text-sm tracking-tight">Untitled Project</h1>
        </div>
        
        <div className="flex items-center gap-4">
            {loading && <span className="text-xs text-yellow-500 animate-pulse">Loading assets...</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
            <button 
                onClick={handleExport}
                disabled={isExporting || loading}
                className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={16} /> {isExporting ? 'Exporting...' : 'Export'}
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Timeline/Layers - Placeholder for now) */}
        {/* <div className="w-64 border-r border-neutral-800 bg-neutral-950 hidden md:block"></div> */}

        {/* Center Canvas */}
        <Canvas 
            ref={screenRef}
            cameraRef={cameraRef}
            videoSrc={screen}
            cameraSrc={camera}
            interactionsSrc={interactions}
            currentTime={currentTime}
            settings={settings}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
        />

        {/* Right Properties Panel */}
        <PropertiesPanel settings={settings} onSettingsChange={setSettings} />
      </div>

      {/* Bottom Timeline / Controls */}
      <footer className="h-24 border-t border-neutral-800 bg-neutral-950 flex flex-col px-4 py-2 z-10">
         {/* Timeline Scrubber */}
         <div className="w-full mb-2 flex items-center gap-4">
            <span className="text-xs font-mono text-neutral-500 w-10 text-right">{formatTime(currentTime)}</span>
            <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                step="0.01"
                value={currentTime} 
                onChange={handleSeek}
                className="flex-1 h-8 bg-transparent cursor-pointer appearance-none [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-neutral-800 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:-mt-1.5"
            />
            <span className="text-xs font-mono text-neutral-500 w-10">{formatTime(duration)}</span>
         </div>

         {/* Playback Controls */}
         <div className="flex items-center justify-center gap-4">
            <button className="text-neutral-400 hover:text-white transition-colors"><SkipBack size={20} /></button>
            <button 
                onClick={togglePlay}
                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <button className="text-neutral-400 hover:text-white transition-colors"><SkipForward size={20} /></button>
         </div>

         {/* Hidden Audio Player */}
         <audio ref={audioRef} src={audio} />
      </footer>
    </div>
  );
};

export default EditorLayout;

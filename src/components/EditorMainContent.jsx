import React from 'react';
import YouTubeMock from './YouTubeMock';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import TranscriptPanel from './TranscriptPanel';
import { Sliders, FileText } from 'lucide-react';

const EditorMainContent = ({
    viewMode,
    panelWidth,
    isExporting,
    onPanelResizeStart,
    // Props for Studio View
    propertiesPanelSettings,
    onSettingsChange,
    selectionVisibility,
    onVisibilityChange,
    selectedOverrideId,
    // Props for YouTube View
    isPlaying,
    onTogglePlay,
    // Canvas Props
    screenRef,
    cameraRef,
    screen,
    camera,
    interactions,
    currentFrame,
    currentTime,
    duration,
    currentSettings,
    getCurrentLayoutMode,
    handleTimeUpdate,
    handleLoadedMetadata,
    isSettingFocalPoint,
    onToggleFocalPointMode,
    onFocalPointSelect,
    // Transcript Props
    activePanel,
    setActivePanel,
    transcript,
    isTranscribing,
    onTranscribe,
    onSeekTranscript,
    hasApiKey
}) => (
    <div className="flex-1 flex overflow-hidden">
        {viewMode === 'youtube' ? (
            <YouTubeMock
                isPlaying={isPlaying}
                onTogglePlay={onTogglePlay}
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
                    isEmbedded={true}
                    settings={{
                        ...currentSettings,
                        layoutMode: getCurrentLayoutMode()
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    isSettingFocalPoint={isSettingFocalPoint}
                    onFocalPointSelect={onFocalPointSelect}
                />
            </YouTubeMock>
        ) : (
            <>
                {/* Left Sidebar - Properties Panel */}
                <div 
                    className="flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col"
                    style={{ width: panelWidth }}
                >
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-neutral-800 bg-neutral-950">
                        <button
                            onClick={() => setActivePanel('properties')}
                            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                                activePanel === 'properties'
                                    ? 'border-blue-500 text-white'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                            <Sliders size={14} />
                            Properties
                        </button>
                        <button
                            onClick={() => setActivePanel('transcript')}
                            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                                activePanel === 'transcript'
                                    ? 'border-blue-500 text-white'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                            }`}
                        >
                            <FileText size={14} />
                            Transcript
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {activePanel === 'properties' ? (
                            <PropertiesPanel 
                                settings={propertiesPanelSettings}
                                onSettingsChange={onSettingsChange}
                                selectionVisibility={selectionVisibility}
                                onVisibilityChange={onVisibilityChange}
                                isBaseSettings={!selectedOverrideId}
                                disabled={isExporting}
                                isSettingFocalPoint={isSettingFocalPoint}
                                onToggleFocalPointMode={onToggleFocalPointMode}
                            />
                        ) : (
                            <TranscriptPanel 
                                transcript={transcript}
                                isLoading={isTranscribing}
                                onTranscribe={onTranscribe}
                                onSeek={onSeekTranscript}
                                currentTime={currentTime}
                                hasApiKey={hasApiKey}
                            />
                        )}
                    </div>
                </div>

                {/* Resize Handle for Panel */}
                <div
                    className={`w-3 -ml-1.5 cursor-col-resize transition-all z-20 flex items-center justify-center group ${isExporting ? 'pointer-events-none opacity-50' : 'hover:bg-blue-500/10'}`}
                    onMouseDown={!isExporting ? onPanelResizeStart : undefined}
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
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        isSettingFocalPoint={isSettingFocalPoint}
                        onFocalPointSelect={onFocalPointSelect}
                    />
                </div>
            </>
        )}
    </div>
);

export default EditorMainContent;

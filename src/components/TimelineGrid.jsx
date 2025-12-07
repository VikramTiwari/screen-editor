import React, { useRef, useState, useEffect } from 'react';

const TimelineGrid = ({ 
    duration, 
    currentTime, 
    timelineData, 
    onSeek, 
    overrides, 
    selectedOverrideId, 
    onOverrideSelect, 
    onHover, 
    selectionRange, 
    onSelectionChange,
    pendingOverrideStart
}) => {
  const containerRef = useRef(null);
  const [hoverTime, setHoverTime] = useState(null);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  
  // Calculate total seconds (rounded up)
  const totalSeconds = Math.ceil(duration || 100);
  const pixelsPerSecond = 20;
  const timelineWidth = Math.max(totalSeconds * pixelsPerSecond, 0);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setIsScrubbing(false);
        setDragStart(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    setHoverTime(time);
    if (onHover) onHover(time);
    
    if (isScrubbing) {
        onSeek(time);
    }

    if (isDragging && dragStart !== null && onSelectionChange) {
        const start = Math.min(dragStart, time);
        const end = Math.max(dragStart, time);
        onSelectionChange({ start, end });
    }
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    if (onHover) onHover(null);
    if (isScrubbing) {
        setIsScrubbing(false);
    }
  };

  const handleSeekClick = (e) => {
    if (isDragging) return; 
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    
    // Normal seek
    onSeek(time);

    // Select override at this time?
    if (overrides && onOverrideSelect) {
        const override = overrides.find(o => time >= o.start && time < o.end);
        if (override) {
            onOverrideSelect(override.id);
        } else {
            // Deselect if clicking on base track
            onOverrideSelect(null);
        }
    }
    
    // Clear selection range on simple click
    if (onSelectionChange) {
        onSelectionChange(null);
    }
  };

  const handleTrackMouseDown = (e) => {
      e.stopPropagation();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
      
      setIsDragging(true);
      setDragStart(time);
      
      // Seek to click position
      onSeek(time);

      // Select override at click position
      if (overrides && onOverrideSelect) {
          const override = overrides.find(o => time >= o.start && time < o.end);
          if (override) {
              onOverrideSelect(override.id);
          } else {
              onOverrideSelect(null);
          }
      }
      
      if (onSelectionChange) {
          onSelectionChange({ start: time, end: time });
      }
  };

  // Helper to determine the visual state of a block
  const getBlockState = (index, trackType) => {
      const currentFrame = timelineData[index];
      if (!currentFrame) return false;

      // For screen/camera, check settings
      if (trackType === 'screen') return currentFrame.settings?.showScreen ?? true;
      if (trackType === 'camera') return currentFrame.settings?.showCamera ?? true;
      
      return currentFrame[trackType];
  };

  // Helper to check if settings changed between frames
  const hasSettingsChanged = (prevIndex, currIndex) => {
      if (prevIndex < 0) return false;
      const prev = timelineData[prevIndex];
      const curr = timelineData[currIndex];
      if (!prev || !curr) return false;
      
      // Simple JSON comparison for settings
      return JSON.stringify(prev.settings) !== JSON.stringify(curr.settings);
  };

  // Auto-scroll to playhead
  useEffect(() => {
    if (containerRef.current && !isDragging && !isScrubbing) { // Don't auto-scroll while dragging/scrubbing
        const playheadPos = currentTime * pixelsPerSecond;
        const scrollLeft = containerRef.current.scrollLeft;
        const width = containerRef.current.clientWidth;
        
        if (playheadPos > scrollLeft + width - 50) {
            containerRef.current.scrollLeft = playheadPos - 50;
        } else if (playheadPos < scrollLeft) {
            containerRef.current.scrollLeft = playheadPos - width + 50;
        }
    }
  }, [currentTime, isDragging, isScrubbing]);

  return (
    <div 
        className="flex-1 overflow-x-auto relative no-scrollbar"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleSeekClick}
    >
        <div style={{ width: `${timelineWidth}px`, minWidth: '100%' }} className="h-full relative">
            
            {/* Grid Lines (every second) */}
            <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: totalSeconds }).map((_, i) => (
                    <div key={i} className="border-r border-neutral-800/30 h-full" style={{ width: `${pixelsPerSecond}px` }} />
                ))}
            </div>

            {/* Base Track Background */}
            <div className="absolute top-0 w-full h-16 pointer-events-none bg-neutral-800/20 border-b border-neutral-800/50">
                <div className="absolute inset-0 flex items-center justify-center text-neutral-700 text-xs font-mono uppercase tracking-widest opacity-50">
                    Base Track
                </div>
            </div>

            {/* Overrides (Production Track) */}
            <div className="absolute top-0 w-full h-16 pointer-events-none">
                {overrides && overrides.map((override) => (
                    <div 
                        key={override.id}
                        className={`absolute top-1 bottom-1 border border-blue-500/50 rounded-md pointer-events-none transition-colors ${
                            selectedOverrideId === override.id ? 'bg-blue-500/20 z-10' : 'bg-blue-900/30 hover:bg-blue-800/40'
                        }`}
                        style={{
                            left: `${override.start * pixelsPerSecond}px`,
                            width: `${(override.end - override.start) * pixelsPerSecond}px`
                        }}
                    >
                        {/* Override Label */}
                        <div className="absolute top-0 left-1 text-[10px] text-blue-300 font-mono truncate max-w-full">
                            {override.settings?.name || 'Override'}
                        </div>
                    </div>
                ))}

                {/* Selection Range Overlay */}
                {selectionRange && (
                    <div 
                        className="absolute top-0 bottom-0 bg-blue-500/20 border-x border-blue-500/50 pointer-events-none z-20"
                        style={{
                            left: `${Math.min(selectionRange.start, selectionRange.end) * pixelsPerSecond}px`,
                            width: `${Math.abs(selectionRange.end - selectionRange.start) * pixelsPerSecond}px`
                        }}
                    />
                )}
            </div>

            {/* Production Track Interaction Layer (Selection & Scrubbing) */}
            <div 
                className="h-16 border-b border-neutral-800/50 relative flex items-center py-1 cursor-text group z-10"
                onMouseDown={handleTrackMouseDown}
            >
                {/* Ruler-like markings */}
                {Array.from({ length: totalSeconds }).map((_, i) => (
                    <div key={i} className="absolute bottom-0 h-2 border-l border-neutral-600 pointer-events-none" style={{ left: `${i * pixelsPerSecond}px` }} />
                ))}
                
                {/* Review Cursor (Ghost) */}
                {hoverTime !== null && (
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/50 z-20 pointer-events-none"
                        style={{ left: `${hoverTime * pixelsPerSecond}px` }}
                    >
                        <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-yellow-400/50 rounded-full shadow-sm" />
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-1 rounded">
                            {(hoverTime || 0).toFixed(1)}s
                        </div>
                    </div>
                )}

                {/* Playhead Handle */}
                <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none"
                    style={{ left: `${currentTime * pixelsPerSecond}px` }}
                >
                    <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm border border-neutral-900" />
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white text-neutral-900 text-[10px] font-bold px-1 rounded">
                        {(currentTime || 0).toFixed(1)}s
                    </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none text-xs text-neutral-500 font-medium">
                    Drag to Select Range / 'S' to Start Override
                </div>
            </div>

            {/* Screen Track */}
            <div className="h-16 border-b border-neutral-800/50 relative flex items-center py-1 pointer-events-none">
                {Array.from({ length: totalSeconds }).map((_, i) => {
                    const isActive = getBlockState(i, 'screen');
                    const isPrevActive = getBlockState(i-1, 'screen');
                    const isNextActive = getBlockState(i+1, 'screen');
                    const settingsChanged = hasSettingsChanged(i-1, i);
                    
                    return (
                        <React.Fragment key={i}>
                            <div 
                                className={`absolute h-full transition-colors ${
                                    isActive ? 'bg-blue-600 z-10' : 'bg-blue-900/20'
                                }`}
                                style={{ 
                                    left: `${i * pixelsPerSecond}px`, 
                                    width: `${pixelsPerSecond}px`,
                                    borderRadius: `${!isPrevActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isPrevActive && isActive ? '4px' : '0'}`
                                }}
                            />
                            {/* Settings Split Divider */}
                            {isActive && settingsChanged && (
                                <div 
                                    className="absolute top-1 bottom-1 w-0.5 bg-white/50 z-20 pointer-events-none"
                                    style={{ left: `${i * pixelsPerSecond}px` }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Camera Track */}
            <div className="h-16 border-b border-neutral-800/50 relative flex items-center py-1 pointer-events-none">
                    {Array.from({ length: totalSeconds }).map((_, i) => {
                    const isActive = getBlockState(i, 'camera');
                    const isPrevActive = getBlockState(i-1, 'camera');
                    const isNextActive = getBlockState(i+1, 'camera');
                    const settingsChanged = hasSettingsChanged(i-1, i);
                    const isCircle = timelineData[i]?.settings?.cameraShape === 'circle';
                    
                    return (
                        <React.Fragment key={i}>
                            <div 
                                className={`absolute h-full transition-colors flex items-center justify-center ${
                                    isActive ? 'bg-green-600 z-10' : 'bg-green-900/20'
                                }`}
                                style={{ 
                                    left: `${i * pixelsPerSecond}px`, 
                                    width: `${pixelsPerSecond}px`,
                                    borderRadius: `${!isPrevActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isPrevActive && isActive ? '4px' : '0'}`
                                }}
                            >
                                {/* Show circle indicator if shape is circle */}
                                {isActive && isCircle && (
                                    <div className="w-2 h-2 bg-white/30 rounded-full" />
                                )}
                            </div>
                            {/* Settings Split Divider */}
                            {isActive && settingsChanged && (
                                <div 
                                    className="absolute top-1 bottom-1 w-0.5 bg-white/50 z-20 pointer-events-none"
                                    style={{ left: `${i * pixelsPerSecond}px` }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Audio Track */}
            <div className="h-16 border-b border-neutral-800/50 relative flex items-center py-1 pointer-events-none">
                    {Array.from({ length: totalSeconds }).map((_, i) => {
                    const isActive = getBlockState(i, 'audio');
                    const isPrevActive = getBlockState(i-1, 'audio');
                    const isNextActive = getBlockState(i+1, 'audio');
                    
                    return (
                        <div 
                            key={i}
                            className={`absolute h-full transition-colors ${
                                isActive ? 'bg-yellow-600 z-10' : 'bg-transparent'
                            }`}
                            style={{ 
                                left: `${i * pixelsPerSecond}px`, 
                                width: `${pixelsPerSecond}px`,
                                borderRadius: `${!isPrevActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isPrevActive && isActive ? '4px' : '0'}`
                            }}
                        />
                    );
                })}
            </div>

            {/* Interactions Track */}
            <div className="h-16 relative flex items-center py-1 pointer-events-none">
                    {Array.from({ length: totalSeconds }).map((_, i) => {
                    const isActive = timelineData[i]?.settings?.showInteractions ?? true;
                    const isPrevActive = timelineData[i-1]?.settings?.showInteractions ?? true;
                    const isNextActive = timelineData[i+1]?.settings?.showInteractions ?? true;
                    
                    return (
                        <div 
                            key={i}
                            className={`absolute h-full transition-colors ${
                                isActive ? 'bg-purple-600 z-10' : 'bg-transparent'
                            }`}
                            style={{ 
                                left: `${i * pixelsPerSecond}px`, 
                                width: `${pixelsPerSecond}px`,
                                borderRadius: `${!isPrevActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isNextActive && isActive ? '4px' : '0'} ${!isPrevActive && isActive ? '4px' : '0'}`
                            }}
                        />
                    );
                })}
            </div>

            {/* Pending Split Marker */}
            {pendingOverrideStart !== null && (
                <div 
                    className="absolute top-0 bottom-0 w-px bg-yellow-500 z-30 pointer-events-none"
                    style={{ left: `${pendingOverrideStart * pixelsPerSecond}px` }}
                >
                    <div className="absolute top-0 -translate-x-1/2 bg-yellow-500 text-black text-[10px] px-1 rounded-sm font-bold">
                        START
                    </div>
                </div>
            )}

            {/* Playhead */}
            <div 
                className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
                style={{ left: `${currentTime * pixelsPerSecond}px` }}
            >
                <div className="absolute top-0 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45 -mt-1.5" />
            </div>

            {/* Hover Indicator */}
            {hoverTime !== null && (
                <div 
                    className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none z-20"
                    style={{ left: `${hoverTime * pixelsPerSecond}px` }}
                />
            )}
        </div>
    </div>
  );
};

export default TimelineGrid;

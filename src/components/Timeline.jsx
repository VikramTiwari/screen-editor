import React from 'react';
import TrackList from './TrackList';
import TimelineGrid from './TimelineGrid';

const Timeline = ({ 
    timelineData, 
    duration, 
    currentTime, 
    onSeek, 
    onHover, 
    overrides, 
    baseSettings,
    selectedOverrideId, 
    onOverrideSelect,
    selectionRange,
    onSelectionChange,
    pendingOverrideStart,
    disabled
}) => {
  return (
    <div className={`flex flex-col h-full bg-neutral-900 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Time Ruler */}
        <div className="h-6 border-b border-neutral-800 flex items-center px-2 text-xs text-neutral-500 select-none">
            <span className="w-24">Tracks</span>
            <div className="flex-1 relative overflow-hidden h-full">
                 {/* Simple markers could go here */}
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden overflow-y-auto">
            <TrackList />
            <TimelineGrid 
                duration={duration}
                currentTime={currentTime}
                timelineData={timelineData}
                onSeek={onSeek}
                overrides={overrides}
                baseSettings={baseSettings}
                selectedOverrideId={selectedOverrideId}
                onOverrideSelect={onOverrideSelect}
                onHover={onHover}
                selectionRange={selectionRange}
                onSelectionChange={onSelectionChange}
                pendingOverrideStart={pendingOverrideStart}
            />
        </div>
    </div>
  );
};

export default Timeline;

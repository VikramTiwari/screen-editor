import React from 'react';
import { Play, Pause } from 'lucide-react';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TimelineToolbar = ({
    isPlaying,
    onTogglePlay, // Renamed from togglePlay for stronger prop convention
    currentTime,
    duration,
    isExporting,
    pendingOverrideStart,
    onMarkOverrideStart, // Renamed from markOverrideStart
    onCompleteOverride, // Renamed from completeOverride
    onCancelOverride, // Renamed from cancelOverride
    selectedOverrideId,
    onDeleteOverride // Renamed from deleteOverride
}) => {
    return (
        <div className={`h-10 border-b border-neutral-800 flex items-center px-4 gap-2 bg-neutral-900 flex-shrink-0 ${isExporting ? 'pointer-events-none opacity-50' : ''}`}>
            <button 
                onClick={onTogglePlay}
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
                    onClick={onMarkOverrideStart}
                    className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
                    title="Start Override Range"
                >
                    <div className="w-3 h-3 border-l border-current" /> Start Override
                </button>
            ) : (
                <>
                    <button 
                        onClick={onCompleteOverride}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-white transition-colors text-xs font-medium flex items-center gap-1 animate-pulse"
                        title="Complete Override Range"
                    >
                        <div className="w-3 h-3 border-r border-current" /> End Override
                    </button>
                    <button 
                        onClick={onCancelOverride}
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
                        onClick={() => onDeleteOverride(selectedOverrideId)}
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
    );
};

export default TimelineToolbar;

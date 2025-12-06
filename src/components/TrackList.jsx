import React from 'react';
import { Monitor, Video, Volume2, Activity, Clock } from 'lucide-react';

const TrackList = () => {
  return (
    <div className="w-24 flex flex-col border-r border-neutral-800 bg-neutral-900 z-10">
        <div className="h-16 flex items-center justify-center border-b border-neutral-800/50 text-neutral-400 gap-2 text-xs font-medium">
            <Clock size={14} /> Production
        </div>
        <div className="h-16 flex items-center justify-center border-b border-neutral-800/50 text-neutral-400 gap-2 text-xs font-medium">
            <Monitor size={14} /> Screen
        </div>
        <div className="h-16 flex items-center justify-center border-b border-neutral-800/50 text-neutral-400 gap-2 text-xs font-medium">
            <Video size={14} /> Camera
        </div>
        <div className="h-16 flex items-center justify-center border-b border-neutral-800/50 text-neutral-400 gap-2 text-xs font-medium">
            <Volume2 size={14} /> Audio
        </div>
        <div className="h-16 flex items-center justify-center text-neutral-400 gap-2 text-xs font-medium">
            <Activity size={14} /> Events
        </div>
    </div>
  );
};

export default TrackList;

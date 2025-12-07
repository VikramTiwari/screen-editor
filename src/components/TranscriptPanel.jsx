import React from 'react';
import { FileText, Wand2, Clock } from 'lucide-react';

const TranscriptPanel = ({ 
  transcript, 
  onSeek, 
  currentTime, 
  isLoading, 
  onTranscribe,
  hasApiKey 
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-sm">Generating transcript...</p>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400 gap-4">
        <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-2">
          <FileText size={24} className="text-neutral-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-white font-medium">No Transcript Available</h3>
          <p className="text-xs text-neutral-500">
            Generate a transcript to navigate your video by text.
          </p>
        </div>
        
        {hasApiKey ? (
          <button
            onClick={onTranscribe}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Wand2 size={16} />
            Generate Transcript
          </button>
        ) : (
          <div className="mt-4 px-4 py-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-yellow-500 text-xs">
            Please add your Gemini API Key in Settings to enable transcription.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 border-l border-neutral-800">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} className="text-blue-500" />
                Transcript
            </h2>
            {hasApiKey && (
              <button
                onClick={onTranscribe}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-all flex items-center gap-1.5 text-xs font-medium"
                title="Regenerate Transcript"
              >
                <Wand2 size={12} />
                Regenerate
              </button>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {transcript.map((segment, index) => {
                const isActive = currentTime >= segment.startTime && currentTime < segment.endTime;
                return (
                    <div
                        key={index}
                        onClick={() => onSeek(segment.startTime)}
                        className={`group p-3 rounded-lg text-sm cursor-pointer transition-all border ${
                            isActive 
                                ? 'bg-blue-900/20 border-blue-800 text-white' 
                                : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1 opacity-50 text-xs font-mono">
                            <Clock size={10} />
                            <span>{(segment.startTime || 0).toFixed(1)}s</span>
                        </div>
                        <p className="leading-relaxed">
                            {segment.text}
                        </p>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default TranscriptPanel;

import React from 'react';
import { Download } from 'lucide-react';

const EditorHeader = ({ isExporting, exportProgress, loading, error, onExport, viewMode, onViewModeChange }) => {
  return (
    <header className="h-14 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-950 z-10 relative">
      <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">S</div>
          <h1 className="font-bold text-sm tracking-tight">New Project</h1>
      </div>
      
      {/* View Mode Selector */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 p-1 rounded-lg border border-neutral-800 flex items-center">
        <button 
            onClick={() => onViewModeChange('studio')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'studio' 
                    ? 'bg-neutral-700 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
        >
            Studio
        </button>
        <button 
            onClick={() => onViewModeChange('youtube')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'youtube' 
                    ? 'bg-neutral-700 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
        >
            YouTube
        </button>
      </div>
      
      <div className="flex items-center gap-4">
          {loading && <span className="text-xs text-yellow-500 animate-pulse">Loading assets...</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
          
          <button 
              onClick={onExport}
              disabled={isExporting || loading}
              className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
              <Download size={16} /> {isExporting ? `Exporting ${Math.round(exportProgress)}%` : 'Export'}
          </button>
      </div>
      
      {/* Progress Bar */}
      {isExporting && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-800">
              <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${exportProgress}%` }}
              />
          </div>
      )}
    </header>
  );
};

export default EditorHeader;

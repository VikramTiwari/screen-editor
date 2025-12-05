import React from 'react';
import { Download } from 'lucide-react';

const EditorHeader = ({ isExporting, loading, error, onExport }) => {
  return (
    <header className="h-14 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-950 z-10">
      <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">S</div>
          <h1 className="font-bold text-sm tracking-tight">Untitled Project</h1>
      </div>
      
      <div className="flex items-center gap-4">
          {loading && <span className="text-xs text-yellow-500 animate-pulse">Loading assets...</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button 
              onClick={onExport}
              disabled={isExporting || loading}
              className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <Download size={16} /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
      </div>
    </header>
  );
};

export default EditorHeader;

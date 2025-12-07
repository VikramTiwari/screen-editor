import React, { useState } from 'react';
import { X, Save, Key } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, apiKey, modelName, onSave }) => {
  const [key, setKey] = useState(apiKey || '');
  const [model, setModel] = useState(modelName || 'gemini-3-pro-preview');

  // No need for useEffect sync if we unmount on close
  
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(key, model);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key size={18} className="text-blue-500" />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Gemini API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <p className="text-xs text-neutral-500">
              Your key is stored locally in your browser. Required for transcription.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Model Name
            </label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="gemini-3-pro-preview">Gemini 3 Pro Preview (Reasoning-First)</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental (Newest)</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Stable High-Intel)</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Stable Fast)</option>
                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B (Fastest)</option>
              </select>
              {/* Custom arrow icon for better styling */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Choose the Gemini model for transcription.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;

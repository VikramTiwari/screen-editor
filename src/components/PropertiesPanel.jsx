import React from 'react';

const PropertiesPanel = ({ settings, onSettingsChange }) => {
  const handleChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="w-80 bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Background</h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-300">Color</label>
                <input 
                    type="color" 
                    value={settings.backgroundColor}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                />
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-300">Padding</label>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={settings.padding}
                    onChange={(e) => handleChange('padding', parseInt(e.target.value))}
                    className="w-32 accent-blue-500"
                />
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Container</h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-300">Border Radius</label>
                <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={settings.borderRadius}
                    onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                    className="w-32 accent-blue-500"
                />
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-300">Shadow</label>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={settings.shadow}
                    onChange={(e) => handleChange('shadow', parseInt(e.target.value))}
                    className="w-32 accent-blue-500"
                />
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Camera</h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-300">Show Camera</label>
                <input 
                    type="checkbox" 
                    checked={settings.showCamera}
                    onChange={(e) => handleChange('showCamera', e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded"
                />
            </div>
            {settings.showCamera && (
                <>
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-neutral-300">Size</label>
                        <input 
                            type="range" 
                            min="100" 
                            max="400" 
                            value={settings.cameraSize}
                            onChange={(e) => handleChange('cameraSize', parseInt(e.target.value))}
                            className="w-32 accent-blue-500"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-neutral-300">Position</label>
                        <select 
                            value={settings.cameraPosition}
                            onChange={(e) => handleChange('cameraPosition', e.target.value)}
                            className="bg-neutral-800 text-white text-sm rounded px-2 py-1 border-none"
                        >
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-neutral-300">Shape</label>
                        <div className="flex bg-neutral-800 rounded p-1">
                            <button 
                                onClick={() => handleChange('cameraShape', 'rectangle')}
                                className={`px-2 py-1 text-xs rounded ${settings.cameraShape === 'rectangle' ? 'bg-neutral-600 text-white' : 'text-neutral-400'}`}
                            >
                                Rect
                            </button>
                            <button 
                                onClick={() => handleChange('cameraShape', 'circle')}
                                className={`px-2 py-1 text-xs rounded ${settings.cameraShape === 'circle' ? 'bg-neutral-600 text-white' : 'text-neutral-400'}`}
                            >
                                Circle
                            </button>
                        </div>
                    </div>

                    {settings.cameraShape === 'rectangle' && (
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-neutral-300">Radius</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="50" 
                                value={settings.cameraBorderRadius}
                                onChange={(e) => handleChange('cameraBorderRadius', parseInt(e.target.value))}
                                className="w-32 accent-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <label className="text-sm text-neutral-300">Shadow</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={settings.cameraShadow}
                            onChange={(e) => handleChange('cameraShadow', parseInt(e.target.value))}
                            className="w-32 accent-blue-500"
                        />
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;

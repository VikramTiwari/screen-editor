import React from 'react'; // Added React import
import { Shuffle } from 'lucide-react';
import BackgroundPicker from './BackgroundPicker';
import { getRandomBackground, SOLIDS } from '../utils/backgrounds';

const PropertiesPanel = ({ settings, onSettingsChange, selectionVisibility, onVisibilityChange, isBaseSettings }) => {
  const [showBackgroundDetails, setShowBackgroundDetails] = React.useState(false);

  const handleChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const getPatternColor = (svgString) => {
    const match = svgString.match(/fill='%23([0-9A-Fa-f]{6})'/);
    return match ? `#${match[1]}` : '#000000';
  };

  const setPatternColor = (svgString, color) => {
    const cleanColor = color.replace('#', '');
    return svgString.replace(/fill='%23[0-9A-Fa-f]{6}'/, `fill='%23${cleanColor}'`);
  };

  return (
    <div className="w-full h-full bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col gap-6 overflow-y-auto">
      
      {/* Mode Indicator */}
      <div className="pb-4 border-b border-neutral-800">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {isBaseSettings ? 'Base Settings' : (settings.name || 'Override Settings')}
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
            {isBaseSettings ? 'Applied to entire video by default' : 'Applied to selected time range'}
        </p>
      </div>
      
      {/* Visibility Settings (Only if selectionVisibility is provided) */}
      {selectionVisibility && (
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Visibility</h3>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-neutral-300">Screen</label>
                    <input 
                        type="checkbox" 
                        checked={selectionVisibility.screen}
                        onChange={(e) => onVisibilityChange('screen', e.target.checked)}
                        className="w-4 h-4 accent-blue-500 rounded"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label className="text-sm text-neutral-300">Camera</label>
                    <input 
                        type="checkbox" 
                        checked={selectionVisibility.camera}
                        onChange={(e) => onVisibilityChange('camera', e.target.checked)}
                        className="w-4 h-4 accent-blue-500 rounded"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label className="text-sm text-neutral-300">Interactions</label>
                    <input 
                        type="checkbox" 
                        checked={settings.showInteractions ?? true}
                        onChange={(e) => onSettingsChange({ ...settings, showInteractions: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 rounded"
                    />
                </div>
            </div>
          </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-200">Background</label>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setShowBackgroundDetails(!showBackgroundDetails)}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded transition-colors"
                >
                    {showBackgroundDetails ? 'Hide' : 'Customize'}
                </button>
                <button
                    onClick={() => onSettingsChange({ ...settings, ...getRandomBackground() })}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                    title="Randomize Background"
                >
                    <Shuffle size={14} />
                </button>
            </div>
        </div>
        
        {showBackgroundDetails && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-2">
                    <BackgroundPicker 
                        value={settings.backgroundColor}
                        onChange={(value) => handleChange('backgroundColor', value)}
                    />
                    {settings.backgroundColor.includes('data:image/svg+xml') && (
                        <div className="space-y-3 mt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-neutral-300">Pattern Scale</label>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="500" 
                                    value={settings.backgroundScale || 100}
                                    onChange={(e) => handleChange('backgroundScale', parseInt(e.target.value))}
                                    className="w-32 accent-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="text-sm text-neutral-300 mb-2 block">Pattern Color</label>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {SOLIDS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('backgroundColor', setPatternColor(settings.backgroundColor, color))}
                                            className={`w-5 h-5 rounded-full border border-neutral-700 hover:scale-110 transition-transform ${
                                                getPatternColor(settings.backgroundColor).toLowerCase() === color.toLowerCase() 
                                                    ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-950' 
                                                    : ''
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
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

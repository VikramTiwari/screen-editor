import React from 'react';
import { Shuffle, Eye, EyeOff, Circle, Square } from 'lucide-react';
import BackgroundPicker from './BackgroundPicker';
import { getRandomBackground, SOLIDS } from '../utils/backgrounds';

const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between group">
        <label className="text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
            {label}
        </label>
        <button 
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${
                checked ? 'bg-blue-600' : 'bg-neutral-700'
            }`}
        >
            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                checked ? 'translate-x-5' : 'translate-x-0'
            }`} />
        </button>
    </div>
);

const Slider = ({ label, value, min, max, onChange, unit = '' }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-400">{label}</label>
            <span className="text-xs font-mono text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">
                {value}{unit}
            </span>
        </div>
        <div className="relative h-6 flex items-center group">
            <div className="absolute w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-600 transition-all duration-75"
                    style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                />
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div 
                className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-all duration-75 group-hover:scale-125"
                style={{ left: `${((value - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }}
            />
        </div>
    </div>
);

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
    <div className="w-full h-full bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col gap-8 overflow-y-auto">
      
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
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Visibility</h3>
            <div className="space-y-4">
                <Toggle 
                    label="Screen" 
                    checked={selectionVisibility.screen} 
                    onChange={(checked) => onVisibilityChange('screen', checked)} 
                />
                <Toggle 
                    label="Camera" 
                    checked={selectionVisibility.camera} 
                    onChange={(checked) => onVisibilityChange('camera', checked)} 
                />
                <Toggle 
                    label="Interactions" 
                    checked={settings.showInteractions ?? true} 
                    onChange={(checked) => onSettingsChange({ ...settings, showInteractions: checked })} 
                />
            </div>
          </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
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
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 mb-4">
                <div className="flex flex-col gap-4">
                    <BackgroundPicker 
                        value={settings.backgroundColor}
                        onChange={(value) => handleChange('backgroundColor', value)}
                    />
                    {settings.backgroundColor.includes('data:image/svg+xml') && (
                        <div className="space-y-4 mt-2 p-3 bg-neutral-900/50 rounded-lg border border-neutral-800">
                            <Slider 
                                label="Pattern Scale" 
                                value={settings.backgroundScale || 100} 
                                min={10} 
                                max={500} 
                                onChange={(val) => handleChange('backgroundScale', val)} 
                            />
                            
                            <div>
                                <label className="text-sm text-neutral-400 mb-2 block">Pattern Color</label>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {SOLIDS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('backgroundColor', setPatternColor(settings.backgroundColor, color))}
                                            className={`w-6 h-6 rounded-full border border-neutral-700 hover:scale-110 transition-transform ${
                                                getPatternColor(settings.backgroundColor).toLowerCase() === color.toLowerCase() 
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' 
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
        
        <Slider 
            label="Padding" 
            value={settings.padding} 
            min={0} 
            max={100} 
            onChange={(val) => handleChange('padding', val)} 
            unit="px"
        />
      </div>

      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Container</h3>
        <div className="space-y-4">
            <Slider 
                label="Border Radius" 
                value={settings.borderRadius} 
                min={0} 
                max={50} 
                onChange={(val) => handleChange('borderRadius', val)} 
                unit="px"
            />
            <Slider 
                label="Shadow" 
                value={settings.shadow} 
                min={0} 
                max={100} 
                onChange={(val) => handleChange('shadow', val)} 
                unit="px"
            />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Camera</h3>
        <div className="space-y-4">
            <Toggle 
                label="Show Camera" 
                checked={settings.showCamera} 
                onChange={(checked) => handleChange('showCamera', checked)} 
            />
            
            {settings.showCamera && (
                <div className="space-y-4 pl-3 border-l-2 border-neutral-800 ml-1">
                    <Slider 
                        label="Size" 
                        value={settings.cameraSize} 
                        min={100} 
                        max={400} 
                        onChange={(val) => handleChange('cameraSize', val)} 
                        unit="px"
                    />
                    
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-neutral-400">Position</label>
                        <div className="grid grid-cols-2 gap-1 w-20">
                            {[
                                { value: 'top-left', label: 'TL' },
                                { value: 'top-right', label: 'TR' },
                                { value: 'bottom-left', label: 'BL' },
                                { value: 'bottom-right', label: 'BR' }
                            ].map((pos) => (
                                <button
                                    key={pos.value}
                                    onClick={() => handleChange('cameraPosition', pos.value)}
                                    className={`h-8 rounded text-xs font-medium transition-colors ${
                                        settings.cameraPosition === pos.value 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                    }`}
                                    title={pos.value.replace('-', ' ')}
                                >
                                    <div className="w-full h-full flex items-center justify-center relative">
                                        <div className={`absolute w-1.5 h-1.5 bg-current rounded-sm ${
                                            pos.value.includes('top') ? 'top-1.5' : 'bottom-1.5'
                                        } ${
                                            pos.value.includes('left') ? 'left-1.5' : 'right-1.5'
                                        }`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-neutral-400">Shape</label>
                        <div className="flex bg-neutral-800 rounded p-1 gap-1">
                            <button 
                                onClick={() => handleChange('cameraShape', 'rectangle')}
                                className={`p-1.5 rounded transition-colors ${settings.cameraShape === 'rectangle' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                                title="Rectangle"
                            >
                                <Square size={14} />
                            </button>
                            <button 
                                onClick={() => handleChange('cameraShape', 'circle')}
                                className={`p-1.5 rounded transition-colors ${settings.cameraShape === 'circle' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                                title="Circle"
                            >
                                <Circle size={14} />
                            </button>
                        </div>
                    </div>

                    {settings.cameraShape === 'rectangle' && (
                        <Slider 
                            label="Corner Radius" 
                            value={settings.cameraBorderRadius} 
                            min={0} 
                            max={50} 
                            onChange={(val) => handleChange('cameraBorderRadius', val)} 
                            unit="px"
                        />
                    )}

                    <Slider 
                        label="Shadow" 
                        value={settings.cameraShadow} 
                        min={0} 
                        max={100} 
                        onChange={(val) => handleChange('cameraShadow', val)} 
                        unit="px"
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;

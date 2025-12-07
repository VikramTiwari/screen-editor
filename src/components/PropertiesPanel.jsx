import React from 'react';
import { Shuffle, Circle, Square, Monitor, Video, MousePointer2, Search } from 'lucide-react';
import BackgroundPicker from './BackgroundPicker';
import { getRandomBackground, SOLIDS } from '../utils/backgrounds';



const PresetControl = ({ label, value, options, onChange }) => (
    <div className="space-y-2">
        <label className="text-sm text-neutral-400">{label}</label>
        <div className="grid grid-cols-4 gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`h-8 rounded text-xs font-medium transition-colors border border-transparent cursor-pointer ${
                        value === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white hover:border-neutral-700'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

const PropertiesPanel = ({ 
    settings, 
    onSettingsChange, 
    selectionVisibility, 
    onVisibilityChange, 
    isBaseSettings, 
    disabled,
    isSettingFocalPoint,
    onToggleFocalPointMode 
}) => {
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
    <div className={`w-full h-full bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col gap-8 overflow-y-auto ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      
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
            <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                <button
                    onClick={() => onVisibilityChange('screen', !selectionVisibility.screen)}
                    className={`flex-1 p-2 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        selectionVisibility.screen 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                    }`}
                    title="Toggle Screen"
                >
                    <Monitor size={18} />
                </button>
                <div className="w-px h-6 bg-neutral-800" />
                <button
                    onClick={() => onVisibilityChange('camera', !selectionVisibility.camera)}
                    className={`flex-1 p-2 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        selectionVisibility.camera 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                    }`}
                    title="Toggle Camera"
                >
                    <Video size={18} />
                </button>
                <div className="w-px h-6 bg-neutral-800" />
                <button
                    onClick={() => onSettingsChange({ ...settings, showInteractions: !(settings.showInteractions ?? true) })}
                    className={`flex-1 p-2 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        (settings.showInteractions ?? true)
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                    }`}
                    title="Toggle Interactions"
                >
                    <MousePointer2 size={18} />
                </button>
            </div>
          </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-neutral-200">Background</label>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setShowBackgroundDetails(!showBackgroundDetails)}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                    {showBackgroundDetails ? 'Hide' : 'Customize'}
                </button>
                <button
                    onClick={() => onSettingsChange({ ...settings, ...getRandomBackground() })}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
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
                            <PresetControl 
                                label="Pattern Scale" 
                                value={settings.backgroundScale || 100}
                                onChange={(val) => handleChange('backgroundScale', val)}
                                options={[
                                    { label: '50%', value: 50 },
                                    { label: '100%', value: 100 },
                                    { label: '200%', value: 200 },
                                    { label: '400%', value: 400 },
                                ]}
                            />
                            
                            <div>
                                <label className="text-sm text-neutral-400 mb-2 block">Pattern Color</label>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {SOLIDS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('backgroundColor', setPatternColor(settings.backgroundColor, color))}
                                            className={`w-6 h-6 rounded-full border border-neutral-700 hover:scale-110 transition-transform cursor-pointer ${
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
        
      <PresetControl 
            label="Padding" 
            value={settings.padding}
            onChange={(val) => handleChange('padding', val)}
            options={[
                { label: 'None', value: 0 },
                { label: 'XS', value: 16 },
                { label: 'S', value: 32 },
                { label: 'M', value: 64 },
                { label: 'L', value: 96 },
            ]}
        />
        
        {isBaseSettings && (
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm text-neutral-400">Audio Offset</label>
                    <span className="text-xs text-neutral-500 font-mono">{(settings.audioOffset || 0).toFixed(1)}s</span>
                </div>
                <input 
                    type="range" 
                    min="-5" 
                    max="5" 
                    step="0.1"
                    value={settings.audioOffset || 0}
                    onChange={(e) => handleChange('audioOffset', parseFloat(e.target.value))}
                    className="w-full"
                />
                <p className="text-[10px] text-neutral-600">
                    Positive delays audio, negative advances it.
                </p>
             </div>
        )}
      </div>
      
      {/* Zoom Controls */}
      {(!selectionVisibility || selectionVisibility.screen) && (
          <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Zoom & Focus</h3>
            </div>
            
            <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm text-neutral-400">Scale</label>
                        <span className="text-xs text-neutral-500 font-mono">{(settings.zoomScale || 1).toFixed(2)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="0.05"
                        value={settings.zoomScale || 1}
                        onChange={(e) => handleChange('zoomScale', parseFloat(e.target.value))}
                        className="w-full"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm text-neutral-400">Focal Point</label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleFocalPointMode}
                            className={`flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                                isSettingFocalPoint 
                                    ? 'bg-blue-900 border-blue-500 text-blue-100 animate-pulse'
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                            }`}
                        >
                            <Search size={14} />
                            {isSettingFocalPoint ? 'Click on Content...' : 'Set Point'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 font-mono mt-1">
                        <div>X: {(settings.focalPointX || 50)}%</div>
                        <div>Y: {(settings.focalPointY || 50)}%</div>
                    </div>
                 </div>
            </div>
          </div>
      )}

      {(!selectionVisibility || selectionVisibility.screen) && (
        <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Screen</h3>
            <div className="space-y-4">
                <PresetControl 
                    label="Corner Radius" 
                    value={settings.borderRadius}
                    onChange={(val) => handleChange('borderRadius', val)}
                    options={[
                        { label: 'XS', value: 4 },
                        { label: 'S', value: 12 },
                        { label: 'M', value: 24 },
                        { label: 'L', value: 40 },
                    ]}
                />
                <PresetControl 
                    label="Shadow" 
                    value={settings.shadow}
                    onChange={(val) => handleChange('shadow', val)}
                    options={[
                        { label: 'None', value: 0 },
                        { label: 'Soft', value: 20 },
                        { label: 'Med', value: 50 },
                        { label: 'High', value: 100 },
                    ]}
                />
            </div>
        </div>
      )}

      {(!selectionVisibility || selectionVisibility.camera) && (
        <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Camera</h3>
            <div className="space-y-4">
                <PresetControl 
                    label="Size" 
                    value={settings.cameraSize}
                    onChange={(val) => handleChange('cameraSize', val)}
                    options={[
                        { label: 'S', value: 150 },
                        { label: 'M', value: 200 },
                        { label: 'L', value: 300 },
                        { label: 'XL', value: 400 },
                    ]}
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
                                className={`h-8 rounded text-xs font-medium transition-colors cursor-pointer ${
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
                            className={`p-1.5 rounded transition-colors cursor-pointer ${settings.cameraShape === 'rectangle' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                            title="Rectangle"
                        >
                            <Square size={14} />
                        </button>
                        <button 
                            onClick={() => handleChange('cameraShape', 'circle')}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${settings.cameraShape === 'circle' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                            title="Circle"
                        >
                            <Circle size={14} />
                        </button>
                    </div>
                </div>

                {settings.cameraShape === 'rectangle' && (
                    <PresetControl 
                        label="Corner Radius" 
                        value={settings.cameraBorderRadius}
                        onChange={(val) => handleChange('cameraBorderRadius', val)}
                        options={[
                            { label: 'XS', value: 4 },
                            { label: 'S', value: 12 },
                            { label: 'M', value: 24 },
                            { label: 'L', value: 40 },
                        ]}
                    />
                )}

                <PresetControl 
                    label="Shadow" 
                    value={settings.cameraShadow}
                    onChange={(val) => handleChange('cameraShadow', val)}
                    options={[
                        { label: 'None', value: 0 },
                        { label: 'Soft', value: 20 },
                        { label: 'Med', value: 50 },
                        { label: 'High', value: 100 },
                    ]}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;

import React, { useState } from 'react';
import { Image, Palette, LayoutTemplate } from 'lucide-react';

const TABS = [
  { id: 'solid', label: 'Solid', icon: Palette },
  { id: 'gradient', label: 'Gradient', icon: LayoutTemplate },
  { id: 'pattern', label: 'Pattern', icon: Image },
];

import { SOLIDS, GRADIENTS, SVG_BACKGROUNDS } from '../utils/backgrounds';

const BackgroundPicker = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState('solid');

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex bg-neutral-900 p-1 rounded-lg">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.id 
                ? 'bg-neutral-700 text-white shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[120px]">
        {activeTab === 'solid' && (
          <div className="grid grid-cols-7 gap-2">
            {SOLIDS.map((color) => (
              <button
                key={color}
                onClick={() => onChange(color)}
                className={`w-6 h-6 rounded-full border border-neutral-700 hover:scale-110 transition-transform ${
                  value === color ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="col-span-7 mt-2 flex items-center gap-2">
                <input 
                    type="color" 
                    value={value.startsWith('#') ? value : '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer bg-neutral-800 border-none"
                />
            </div>
          </div>
        )}

        {activeTab === 'gradient' && (
          <div className="grid grid-cols-4 gap-2">
            {GRADIENTS.map((gradient) => (
              <button
                key={gradient}
                onClick={() => onChange(gradient)}
                className={`w-full aspect-square rounded-lg border border-neutral-700 hover:scale-105 transition-transform ${
                  value === gradient ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''
                }`}
                style={{ background: gradient }}
              />
            ))}
          </div>
        )}

        {activeTab === 'pattern' && (
          <div className="grid grid-cols-3 gap-2">
            {SVG_BACKGROUNDS.map((url, index) => (
              <button
                key={index}
                onClick={() => onChange(url)}
                className={`w-full aspect-video rounded-lg border border-neutral-700 overflow-hidden hover:opacity-90 transition-opacity bg-neutral-800 ${
                  value === url ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''
                }`}
              >
                <div 
                    className="w-full h-full"
                    style={{ 
                        background: url,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }} 
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundPicker;

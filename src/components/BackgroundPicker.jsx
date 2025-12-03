import React, { useState } from 'react';
import { Image, Palette, LayoutTemplate } from 'lucide-react';

const TABS = [
  { id: 'solid', label: 'Solid', icon: Palette },
  { id: 'gradient', label: 'Gradient', icon: LayoutTemplate },
  { id: 'pattern', label: 'Pattern', icon: Image },
];

export const SOLIDS = [
  '#171717', '#262626', '#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4', '#ffffff',
  '#f87171', '#ef4444', '#dc2626', '#b91c1c', // Red
  '#fb923c', '#f97316', '#ea580c', '#c2410c', // Orange
  '#fbbf24', '#f59e0b', '#d97706', '#b45309', // Amber
  '#a3e635', '#84cc16', '#65a30d', '#4d7c0f', // Lime
  '#4ade80', '#22c55e', '#16a34a', '#15803d', // Green
  '#34d399', '#10b981', '#059669', '#047857', // Emerald
  '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', // Cyan
  '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', // Blue
  '#818cf8', '#6366f1', '#4f46e5', '#4338ca', // Indigo
  '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', // Violet
  '#e879f9', '#d946ef', '#c026d3', '#a21caf', // Fuchsia
  '#f472b6', '#ec4899', '#db2777', '#be185d', // Pink
  '#fb7185', '#f43f5e', '#e11d48', '#be123c', // Rose
];

const GRADIENTS = [
  'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)',
  'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
  'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
  'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
  'linear-gradient(135deg, #000000 0%, #434343 100%)',
  'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
  'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
  'linear-gradient(to top, #5f72bd 0%, #9b23ea 100%)',
  'linear-gradient(to top, #09203f 0%, #537895 100%)',
  'radial-gradient(circle at 50% 50%, #4a00e0 0%, #8e2de2 100%)',
  'radial-gradient(circle at 50% 50%, #200122 0%, #6f0000 100%)',
  'linear-gradient(to right, #b92b27, #1565c0)',
  'linear-gradient(to right, #373b44, #4286f4)',
  'linear-gradient(to right, #8e2de2, #4a00e0)',
  'linear-gradient(to right, #f953c6, #b91d73)',
  'linear-gradient(to right, #c31432, #240b36)',
  'linear-gradient(to right, #f12711, #f5af19)',
  'linear-gradient(to right, #659999, #f4791f)',
  'linear-gradient(to right, #dd3e54, #6be585)',
];

const SVG_BACKGROUNDS = [
  // Blue Dots
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233B82F6' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
  // Purple Grid
  `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%238B5CF6' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
  // Green Diagonals
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310B981' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10zM10 0h10v10H10V0z'/%3E%3C/g%3E%3C/svg%3E")`,
  // Red Circuit
  `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23EF4444' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Orange Topography
  `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23F59E0B' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Cyan Hexagons
  `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10zM24 20c5.523 0 10-4.477 10-10V0h-20v10c0 5.523 4.477 10 10 10zM24 40c5.523 0 10-4.477 10-10V20h-20v10c0 5.523 4.477 10 10 10z' fill='%2306B6D4' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Pink Waves
  `url("data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 20 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23EC4899' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 0h20v2H0V0zm0 10h20v2H0v-2zm0-5h20v2H0V5z'/%3E%3C/g%3E%3C/svg%3E")`,
  // Indigo Arches
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366F1' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z'/%3E%3C/g%3E%3C/svg%3E")`,
  // Yellow Chevrons
  `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 18.26l-8.6-7.5 1.4-1.6 7.2 6.28 7.2-6.28 1.4 1.6z' fill='%23EAB308' fill-opacity='0.15'/%3E%3C/svg%3E")`,
  // Teal Plus
  `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 19h-6v2h6v6h2v-6h6v-2h-6v-6h-2z' fill='%2314B8A6' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Rose Triangles
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 4L4 14h12z' fill='%23F43F5E' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Violet Zigzag
  `url("data:image/svg+xml,%3Csvg width='40' height='12' viewBox='0 0 40 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6l10-6 10 6 10-6 10 6v6l-10-6-10 6-10-6-10 6z' fill='%238B5CF6' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Amber Crosses
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 4h2v2H5V5zm4 4h2v2H9V9zm4 4h2v2h-2v-2zm4 4h2v2h-2v-2z' fill='%23F59E0B' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Sky Circles
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='2' fill='%230EA5E9' fill-opacity='0.15'/%3E%3C/svg%3E")`,
  // Lime Squares
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='2' y='2' width='4' height='4' fill='%2384CC16' fill-opacity='0.15'/%3E%3C/svg%3E")`,
  // Fuchsia Rhombus
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l10 10-10 10L0 10z' fill='%23D946EF' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Emerald Wiggle
  `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 5c1.333 0 2.667 1.667 4 5C5.333 8.333 6.667 5 8 5s2.667 1.667 4 5V0C10.667 3.333 9.333 0 8 0S5.333 3.333 4 0C2.667 1.667 1.333 0 0 0v5z' fill='%2310B981' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  // Indigo Scales
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10c0-5.523 4.477-10 10-10v10H10zM0 10c0-5.523 4.477-10 10-10v10H0zM10 20c0-5.523 4.477-10 10-10v10H10zM0 20c0-5.523 4.477-10 10-10v10H0z' fill='%236366F1' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
];

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

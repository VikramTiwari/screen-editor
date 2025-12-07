import React from 'react';

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

export default PresetControl;

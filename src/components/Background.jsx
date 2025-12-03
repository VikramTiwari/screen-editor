import React from 'react';

const Background = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-neutral-950">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/30 blur-[120px] animate-blob mix-blend-screen filter" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/30 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen filter" />
      <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-900/30 blur-[120px] animate-blob animation-delay-4000 mix-blend-screen filter" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-900/30 blur-[120px] animate-blob animation-delay-6000 mix-blend-screen filter" />
      
      {/* Overlay for texture/noise if needed, keeping it simple for now */}
      <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[1px]" />
    </div>
  );
};

export default Background;

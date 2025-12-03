import React, { forwardRef } from 'react';
import VideoPlayer from './VideoPlayer';
import InteractionVisualizer from './InteractionVisualizer';

const Canvas = forwardRef(({ 
    videoSrc, 
    cameraSrc,
    interactionsSrc, 
    currentTime, 
    settings, 
    onTimeUpdate, 
    onLoadedMetadata,
    cameraRef
}, ref) => {
  
  const getCameraPositionStyle = () => {
      const margin = 20;
      switch(settings.cameraPosition) {
          case 'top-left': return { top: margin, left: margin };
          case 'top-right': return { top: margin, right: margin };
          case 'bottom-left': return { bottom: margin, left: margin };
          case 'bottom-right': return { bottom: margin, right: margin };
          default: return { bottom: margin, left: margin };
      }
  };

  return (
    <div 
        className="flex-1 bg-neutral-900 overflow-hidden flex items-center justify-center p-8"
        style={{ backgroundColor: settings.backgroundColor }}
    >
      <div 
        className="relative transition-all duration-200 ease-out"
        style={{ 
            padding: `${settings.padding}px`,
        }}
      >
        <div 
            className="relative overflow-hidden bg-black"
            style={{ 
                borderRadius: `${settings.borderRadius}px`,
                boxShadow: `0 ${settings.shadow}px ${settings.shadow * 2}px rgba(0,0,0,0.5)`
            }}
        >
            <VideoPlayer 
                ref={ref}
                src={videoSrc}
                isMuted={true}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                className="!border-none !rounded-none" // Override default styles
            />
            <InteractionVisualizer src={interactionsSrc} currentTime={currentTime} />
            
            {/* Camera PiP */}
            {settings.showCamera && (
                <div 
                    className="absolute z-20 overflow-hidden transition-all duration-300"
                    style={{
                        width: `${settings.cameraSize}px`,
                        height: settings.cameraShape === 'circle' ? `${settings.cameraSize}px` : `${settings.cameraSize * (9/16)}px`,
                        borderRadius: settings.cameraShape === 'circle' ? '50%' : `${settings.cameraBorderRadius}px`,
                        boxShadow: `0 ${settings.cameraShadow}px ${settings.cameraShadow * 2}px rgba(0,0,0,0.5)`,
                        ...getCameraPositionStyle()
                    }}
                >
                    <VideoPlayer 
                        ref={cameraRef}
                        src={cameraSrc}
                        isMuted={true}
                        objectFit="cover"
                        className="!border-none !rounded-none w-full h-full"
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;

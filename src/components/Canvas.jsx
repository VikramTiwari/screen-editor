import React, { forwardRef } from 'react';
import VideoPlayer from './VideoPlayer';
import InteractionVisualizer from './InteractionVisualizer';

const Canvas = forwardRef(({ 
    videoSrc, 
    cameraSrc,
    interactionsSrc, 
    showInteractions,
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

    const backgroundColor = settings.backgroundColor || '#000000';
    const isPattern = backgroundColor.includes('data:image/svg+xml');
    const { layoutMode = 'default' } = settings;

    // Determine main video source based on layout mode
    let mainVideoSrc = videoSrc;
    let mainVideoRef = ref;
    let showPiP = false;

    if (layoutMode === 'full-camera') {
        mainVideoSrc = cameraSrc;
        mainVideoRef = cameraRef;
        showPiP = false;
    } else if (layoutMode === 'composition') {
        mainVideoSrc = videoSrc;
        mainVideoRef = ref;
        showPiP = settings.showCamera;
    } else {
        // full-screen or default
        mainVideoSrc = videoSrc;
        mainVideoRef = ref;
        showPiP = false;
    }

    if (layoutMode === 'hidden') {
        return (
            <div className="flex-1 bg-black overflow-hidden flex items-center justify-center relative">
                {/* Always render master video for timing */}
                <VideoPlayer 
                    ref={ref}
                    src={videoSrc}
                    isMuted={true}
                    onTimeUpdate={onTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    className="hidden"
                />
            </div>
        );
    }

    return (
    <div className="flex-1 bg-black overflow-hidden flex items-center justify-center">
      <div className="w-auto h-auto max-w-full max-h-[80vh] aspect-video flex items-center justify-center">
        <div 
            className="w-full h-full flex items-center justify-center transition-all duration-200"
            style={{ 
                backgroundColor: !isPattern && !backgroundColor.includes('gradient') ? backgroundColor : undefined,
                backgroundImage: isPattern || backgroundColor.includes('gradient') ? backgroundColor : undefined,
                backgroundSize: isPattern ? `${settings.backgroundScale}px` : 'cover', 
                backgroundPosition: 'center center',
                backgroundRepeat: isPattern ? 'repeat' : 'no-repeat'
            }}
        >
            <div 
                className="relative transition-all duration-200 ease-out w-full h-full flex items-center justify-center"
                style={{ 
                    padding: `${settings.padding}px`,
                }}
            >
                <div 
                    className="relative overflow-hidden bg-black w-full h-full"
                    style={{ 
                        borderRadius: `${settings.borderRadius}px`,
                        boxShadow: `0 ${settings.shadow}px ${settings.shadow * 2}px rgba(0,0,0,0.5)`
                    }}
                >
                    {/* Main Video */}
                    <div 
                        className="w-full h-full transition-transform duration-500 ease-in-out"
                        style={{
                            transform: (() => {
                                const zoom = settings.zoomScale || 1;
                                const fx = settings.focalPointX !== undefined ? settings.focalPointX : 50;
                                const fy = settings.focalPointY !== undefined ? settings.focalPointY : 50;
                                
                                // Calculate raw translation to center the focal point
                                let tx = 50 - (fx * zoom);
                                let ty = 50 - (fy * zoom);

                                // Clamp values to ensure we don't show black bars
                                // The translation must be between 100*(1-zoom) and 0
                                const minTranslate = 100 * (1 - zoom);
                                const maxTranslate = 0;

                                tx = Math.min(maxTranslate, Math.max(minTranslate, tx));
                                ty = Math.min(maxTranslate, Math.max(minTranslate, ty));

                                return `translate(${tx}%, ${ty}%) scale(${zoom})`;
                            })(),
                            transformOrigin: '0 0'
                        }}
                    >
                        <VideoPlayer 
                            ref={mainVideoRef}
                            src={mainVideoSrc}
                            isMuted={true}
                            onTimeUpdate={mainVideoRef === ref ? onTimeUpdate : undefined}
                            onLoadedMetadata={mainVideoRef === ref ? onLoadedMetadata : undefined}
                            className="!border-none !rounded-none w-full h-full" 
                        />
                        
                        <InteractionVisualizer src={interactionsSrc} currentTime={currentTime} />
                        
                        {/* Interactions Layer */}
                        {showInteractions && interactionsSrc && (
                            <img 
                                src={interactionsSrc}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
                                style={{ opacity: 0.8 }}
                            />
                        )}
                    </div>
                    
                    {/* If main video is NOT the screen ref (e.g. full-camera), we still need to render screen ref hidden for timing if it's the master */}
                    {mainVideoRef !== ref && (
                         <VideoPlayer 
                            ref={ref}
                            src={videoSrc}
                            isMuted={true}
                            onTimeUpdate={onTimeUpdate}
                            onLoadedMetadata={onLoadedMetadata}
                            className="hidden"
                        />
                    )}


                    
                    {/* Camera PiP */}
                    {showPiP && (
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
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;

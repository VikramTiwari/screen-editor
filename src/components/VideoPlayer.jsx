import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import clsx from 'clsx';

const VideoPlayer = forwardRef(({ src, className, label, isMuted = false, onLoadedMetadata, onTimeUpdate, objectFit = 'contain' }, ref) => {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time) => {
        if (videoRef.current && Number.isFinite(time)) {
            videoRef.current.currentTime = time;
        }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
    getVideoElement: () => videoRef.current,
  }));

  return (
    <div className={clsx("bg-black rounded-lg border border-neutral-800 relative overflow-hidden group", className)}>
      {label && (
        <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs font-mono text-neutral-300 z-10">
          {label}
        </div>
      )}
      
      {src ? (
        <video 
          ref={videoRef}
          src={src}
          className={clsx("w-full h-full", objectFit === 'cover' ? 'object-cover' : 'object-contain')}
          muted={isMuted}
          playsInline
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-600">
          No Signal
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

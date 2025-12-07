import { useState, useRef, useEffect } from 'react';


export const useVideoExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup worker on unmount
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const startExport = async ({ 
    screenVideo, 
    cameraVideo, 
    audioElement, 
    // settings, // DEPRECATED: Use baseSettings and overrides instead
    baseSettings,
    overrides = [],
    duration,
    interactionsData,
    onComplete 
  }) => {
    if (!screenVideo || !duration) return;

    setIsExporting(true);
    setProgress(0);


    // 1. Setup Canvas (4K Resolution)
    const width = 3840;
    const height = 2160;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;
    // Context is created in worker via transferControlToOffscreen


    // Scale Factor (Design is based on ~1080p logic, so we scale up for 4K)
    // 1080p (1920x1080) -> 4K (3840x2160) = 2x
    const scaleFactor = 2; 

    // Preload Background Image if needed (using baseSettings as default)
    let backgroundImage = null;
    const initialSettings = baseSettings;
    if (initialSettings.backgroundColor.startsWith('url')) {
        const url = initialSettings.backgroundColor.match(/url\(['"]?(.*?)['"]?\)/)[1];
        if (url) {
            try {
                backgroundImage = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous"; // Important for canvas export
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = url;
                });
            } catch (e) {
                console.error("Failed to load background image", e);
            }
        }
    }

    // 2. Setup Audio for Worker (if needed)
    let exportAudio = null;
    let exportAudioContext = null;
    let audioTrack = null;
    
    // Audio Offset Logic
    const audioOffset = baseSettings.audioOffset || 0;

    if (audioElement) {
        exportAudio = audioElement.cloneNode(true);
        exportAudio.crossOrigin = "anonymous";
        
        exportAudioContext = new AudioContext();
        const dest = exportAudioContext.createMediaStreamDestination();
        const source = exportAudioContext.createMediaElementSource(exportAudio);
        
        if (audioOffset > 0) {
            const delayNode = exportAudioContext.createDelay(Math.max(1.0, audioOffset + 1.0));
            delayNode.delayTime.value = audioOffset;
            source.connect(delayNode);
            delayNode.connect(dest);
        } else {
            source.connect(dest);
        }
        
        const audioTracks = dest.stream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTrack = audioTracks[0];
        }
    }

    // Initialize Worker
    workerRef.current = new Worker(new URL('../workers/render.worker.js', import.meta.url), {
        type: 'module'
    });
    
    // Handle Worker Messages
    workerRef.current.onmessage = (e) => {
        const { type, buffer } = e.data;
        if (type === 'DONE') {
            const blob = new Blob([buffer], { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screen-studio-export-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Cleanup Audio Context
            if (exportAudioContext) {
                exportAudioContext.close();
            }
            setIsExporting(false);
            if (onComplete) onComplete();
        }
    };
    
    // Transfer Canvas
    const offscreen = canvas.transferControlToOffscreen();
    
    // Prepare background image bitmap
    let bgBitmap = null;
    if (backgroundImage) {
        bgBitmap = await createImageBitmap(backgroundImage);
    }
    
    // Prepare Audio Stream (if supported)
    let audioStream = null;
    if (audioTrack && window.MediaStreamTrackProcessor) {
        const processor = new MediaStreamTrackProcessor({ track: audioTrack });
        audioStream = processor.readable;
    }
    
    const transferList = [offscreen];
    if (bgBitmap) transferList.push(bgBitmap);
    if (audioStream) transferList.push(audioStream);

    workerRef.current.postMessage({
        type: 'INIT',
        payload: {
            canvas: offscreen,
            settings: baseSettings,
            interactionsData,
            backgroundImage: bgBitmap,
            config: { scaleFactor },
            audioStream: audioStream 
        }
    }, transferList);

    // 4. Start Playback & Loop
    
    const videos = [screenVideo];
    if (cameraVideo) videos.push(cameraVideo);
    
    if (exportAudio) {
        if (audioOffset < 0) {
            exportAudio.currentTime = Math.abs(audioOffset);
        } else {
            exportAudio.currentTime = 0;
        }
        exportAudio.volume = 1.0; 
        exportAudio.play();
    }
    
    videos.forEach(v => {
        v.currentTime = 0;
        v.play();
    });

    const drawFrame = async () => {
        if (!screenVideo) return;

        // Update Progress
        const current = screenVideo.currentTime;
        setProgress((current / duration) * 100);

        if (current >= duration || screenVideo.ended) {
            stopExport(videos, exportAudio);
            // Tell worker to finish
            workerRef.current.postMessage({ type: 'FINISH' });
            return;
        }
        
        try {
            const screenBitmap = await createImageBitmap(screenVideo);
            let cameraBitmap = null;
            if (cameraVideo && cameraVideo.readyState >= 2) {
                cameraBitmap = await createImageBitmap(cameraVideo);
            }
            
            workerRef.current.postMessage({
                type: 'RENDER_FRAME',
                payload: {
                    screenBitmap,
                    cameraBitmap,
                    timestamp: current,
                    baseSettings,
                    overrides
                }
            }, [screenBitmap, ...(cameraBitmap ? [cameraBitmap] : [])]);
        } catch (e) {
            console.error("Frame capture error:", e);
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const stopExport = (videos, exportAudio) => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    videos.forEach(v => v.pause());
    if (exportAudio) exportAudio.pause();
    
    // Note: We do NOT terminate worker here immediately if we wait for 'DONE'
    // But 'stopExport' is called when duration ends.
    // If user manually cancels? We should likely handle that separate.
    // For now assuming success flow.
  };

  return {
    isExporting,
    progress,
    startExport
  };
};

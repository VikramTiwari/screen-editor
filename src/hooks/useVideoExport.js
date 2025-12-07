
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

    // --- REALTIME AUDIO STREAM SETUP ---
    let audioStream = null;
    let exportAudio = null;
    let exportAudioContext = null;
    let audioTrack = null;
    
    // Audio Offset Logic
    const audioOffset = baseSettings.audioOffset || 0;

    // Create a mixed source? 
    // We can use captureStream() on video, but that mutes it?
    // Better to clone element.
    if (audioElement || screenVideo.getAttribute('src')) {
         exportAudioContext = new AudioContext();
         const dest = exportAudioContext.createMediaStreamDestination();
         // Background Audio
         if (audioElement) {
             exportAudio = audioElement.cloneNode(true);
             exportAudio.crossOrigin = "anonymous";
             const source = exportAudioContext.createMediaElementSource(exportAudio);
             if (audioOffset > 0) {
                 const delayNode = exportAudioContext.createDelay(Math.max(1.0, audioOffset + 1.0));
                 delayNode.delayTime.value = audioOffset;
                 source.connect(delayNode);
                 delayNode.connect(dest);
             } else {
                 source.connect(dest);
             }
         }

         // Screen Audio (if present in video file)
         // We can try to capture from screenVideo?
         // Note: captureStream() on screenVideo might conflict with playback? 
         // Usually safest to just use `captureStream(0)` on video element if we play it.
         // If we use `captureStream` on video, we get video+audio tracks.
         // We only want audio.
         // But `createMediaElementSource` requires CORS or same-origin.
         // Blob url is same-origin.
         if (screenVideo.src) {
             try {
                // If we use createMediaElementSource on screenVideo, it redirects output!
                // So we can't hear it. That's fine for export.
                // BUT we need it to play on screen? 
                // We should clone it for audio extraction?
                // Cloning a video blob element is cheap.
                 const vidClone = document.createElement('video');
                 vidClone.src = screenVideo.src;
                 vidClone.muted = true; // We don't want to hear it, but we need stream?
                 // No, createMediaElementSource output is the stream.
                 // We don't need to play it if we use `captureStream`?
                 // Let's use `screenVideo` directly if possible, but redirecting output silences it for user.
                 // Actually, export is overlay mode?
                 // Let's rely on `captureStream` of screenVideo for audio track.
                 
                 // However, captureStream() is simplest.
                 // If we use `screenVideo.captureStream()`, we get tracks.
                 // We can pipe them.
             } catch (e) {
                 console.warn("Screen audio setup failed", e);
             }
         }
         
         // Simplified Audio: Just use what we can get.
         // Use the `exportAudio` (background) if exists. 
         // Integrating Screen Audio is tricky without `captureStream` or graph routing.
         // Given "Audio decode failed" earlier, maybe Screen Audio is the issue.
         // Let's try to include Background Audio properly first.
         
         const audioTracks = dest.stream.getAudioTracks();
         if (audioTracks.length > 0) {
             audioTrack = audioTracks[0];
         }
    }
    
    // Prepare Audio Stream Transfer
    if (audioTrack && window.MediaStreamTrackProcessor) {
        const processor = new MediaStreamTrackProcessor({ track: audioTrack });
        audioStream = processor.readable;
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
            
            if (exportAudioContext) exportAudioContext.close();
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
            audioStream // Send stream
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
        exportAudio.play().catch(e => console.warn("Audio play fail", e));
    }
    
    videos.forEach(v => {
        v.currentTime = 0;
        v.play().catch(e => console.warn("Video play fail", e));
    });

    const drawFrame = async () => {
        if (!screenVideo) return;

        // Update Progress
        const current = screenVideo.currentTime;
        setProgress((current / duration) * 100);

        if (current >= duration || screenVideo.ended) {
            stopExport(videos, exportAudio);
            if (workerRef.current) workerRef.current.postMessage({ type: 'FINISH' });
            return;
        }
        
        try {
            const screenBitmap = await createImageBitmap(screenVideo);
            let cameraBitmap = null;
            if (cameraVideo && cameraVideo.readyState >= 2) {
                cameraBitmap = await createImageBitmap(cameraVideo);
            }
            
            if (workerRef.current) {
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
            } else {
                 screenBitmap.close();
                 if (cameraBitmap) cameraBitmap.close();
                 return;
            }
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
    videos && videos.forEach(v => v.pause());
    if (exportAudio) exportAudio.pause();
    // Worker termination is handled after DONE or manual stop
  };

  const manualStop = () => {
     if (workerRef.current) {
         workerRef.current.terminate();
         workerRef.current = null;
     }
     setIsExporting(false);
  };

  return {
    isExporting,
    progress,
    startExport,
    stopExport: manualStop
  };
};

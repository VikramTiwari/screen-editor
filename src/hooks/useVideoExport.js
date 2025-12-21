
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

    // Apply Trim Start
    const trimStart = baseSettings.trimStart || 0;
    const effectiveDuration = duration - trimStart;

    if (effectiveDuration <= 0) {
        console.error("Export duration is zero or negative after trim");
        // Should probably notify user, but for now just return
        return;
    }

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

    // --- OFFLINE AUDIO SETUP ---
    // Fetch and decode the audio file directly to pass raw buffers to the worker.
    // This avoids realtime sync issues and browser inconsistencies.
    
    let audioBuffers = [];
    const mainAudioSrc = audioElement?.src || audioElement?.currentSrc;
    // Check if we have background audio
    if (mainAudioSrc) {
       try {
           console.log("Export: Fetching audio...", mainAudioSrc);
           const response = await fetch(mainAudioSrc);
           const arrayBuffer = await response.arrayBuffer();
           
           // Decode
           const tempCtx = new AudioContext(); // OfflineAudioContext is faster? AudioContext is fine.
           const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
           
           // Extract Mono Channel (simplification)
           const data = audioBuffer.getChannelData(0); 
           
           audioBuffers.push({
               data: data, // Float32Array
               sampleRate: audioBuffer.sampleRate,
               // Shift audio offset by trimStart.
               // If trimStart is 5s, we want audio at 5s (src) to be at 0s (export).
               // audioOffset handles relative shift.
               // If audioOffset=0, we want src 5s -> export 0s.
               // Worker logic: index = (time - offset) * sr.
               // At export time 0, we want index for 5s.
               // (0 - offset) * sr = 5 * sr => offset = -5.
               // So offset = originalOffset - trimStart.
               offset: (baseSettings.audioOffset || 0) - trimStart
           });
           
           console.log("Export: Audio decoded.", {
               duration: audioBuffer.duration,
               sampleRate: audioBuffer.sampleRate,
               length: data.length
           });
           
           tempCtx.close();
       } catch (e) {
           console.error("Export: Failed to load audio file", e);
           // Fallback or notify?
       }
    }
    
    // Future: Handle Screen Audio via similar fetch on blob if needed.
    // For now, prioritize the background audio which was the reported issue.

    // Initialize Worker

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
            
            // if (exportAudioContext) exportAudioContext.close(); // Removed in offline refactor
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
    // if (audioStream) transferList.push(audioStream); // Removed in offline refactor
    
    console.log("Export: Initializing worker. Audio Buffers:", audioBuffers.length);
    if (audioBuffers.length > 0) {
        console.log("Export: First buffer length:", audioBuffers[0].data.length);
    }
    
    workerRef.current.postMessage({
        type: 'INIT',
        payload: {
            canvas: offscreen,
            settings: baseSettings,
            interactionsData: interactionsData.map(i => ({ ...i, timestamp: i.timestamp - trimStart })),
            backgroundImage: bgBitmap,
            config: { scaleFactor },
            audioBuffers: audioBuffers // Pass decoded buffers
        }
    }, transferList);

    // 4. Start Playback & Loop
    const videos = [screenVideo];
    if (cameraVideo) videos.push(cameraVideo);
    
    // Note: We don't need to play 'exportAudio' element anymore since we decoded it offline.
    // But we might want to mute the actual audio element in the DOM if it was playing?
    // Actually, `audioElement` passed here is usually a ref to the hidden audio element.
    // We shouldn't play it during export if we don't want double audio, 
    // BUT the user cannot hear the export happen usually (it's often silent or just progress bar).
    // If the logical flow is "play video to record", then we might hear it.
    // However, since we are doing offline audio encoding, we definitely don't need to play the audio element for the recorder's sake.
    // We might play it for the user's feedback, but let's stick to video only to improve performance.
    
    videos.forEach(v => {
        v.currentTime = trimStart; // Start from trimStart
        v.play().catch(e => console.warn("Video play fail", e));
    });

    const drawFrame = async () => {
        if (!screenVideo) return;

        // Update Progress
        const current = screenVideo.currentTime;
        // Progress based on effective duration
        setProgress(((current - trimStart) / effectiveDuration) * 100);

        // Stop if we reach the end of the original duration OR if the video ends
        if (current >= duration || screenVideo.ended) {
            stopExport(videos);
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
                // Shift Overrides
                const shiftedOverrides = overrides.map(o => ({
                    ...o,
                    start: o.start - trimStart,
                    end: o.end - trimStart
                }));

                workerRef.current.postMessage({
                    type: 'RENDER_FRAME',
                    payload: {
                        screenBitmap,
                        cameraBitmap,
                        timestamp: current - trimStart, // Shift timestamp
                        baseSettings,
                        overrides: shiftedOverrides
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
  
  const stopExport = (videos) => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    videos && videos.forEach(v => v.pause());
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

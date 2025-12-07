import { useState, useRef } from 'react';

export const useVideoExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

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
    chunksRef.current = [];

    // 1. Setup Canvas (4K Resolution)
    const width = 3840;
    const height = 2160;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

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

    // 2. Setup Stream & Recorder
    const canvasStream = canvas.captureStream(60); // 60 FPS for smoother quality
    
    // Combine audio if available
    let finalStream = canvasStream;
    let exportAudio = null;
    let exportAudioContext = null;
    
    // Audio Offset Logic
    // If offset > 0: Audio is delayed (plays later than video start) -> proper sync needs delay
    // If offset < 0: Audio is early (starts before video) -> we seek into audio to skip start
    const audioOffset = baseSettings.audioOffset || 0;

    if (audioElement) {
        // Clone the audio element to avoid "already connected" errors
        exportAudio = audioElement.cloneNode(true);
        exportAudio.crossOrigin = "anonymous";
        
        exportAudioContext = new AudioContext();
        const dest = exportAudioContext.createMediaStreamDestination();
        const source = exportAudioContext.createMediaElementSource(exportAudio);
        
        if (audioOffset > 0) {
            // Delay the audio signal
            // Max delay buffer needs to cover the offset
            const delayNode = exportAudioContext.createDelay(Math.max(1.0, audioOffset + 1.0));
            delayNode.delayTime.value = audioOffset;
            source.connect(delayNode);
            delayNode.connect(dest);
        } else {
            source.connect(dest);
        }
        
        // Mix audio tracks
        const audioTracks = dest.stream.getAudioTracks();
        if (audioTracks.length > 0) {
            finalStream.addTrack(audioTracks[0]);
        }
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';

    const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 60000000 // 60 Mbps for 8K
    });

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
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
    };

    mediaRecorderRef.current = recorder;

    // 3. Prepare Playback
    const videos = [screenVideo];
    if (cameraVideo) videos.push(cameraVideo);
    if (exportAudio) {
        if (audioOffset < 0) {
            // Audio starts early, so we skip the first part
            exportAudio.currentTime = Math.abs(audioOffset);
        } else {
            exportAudio.currentTime = 0;
        }
        exportAudio.volume = 1.0; 
    }

    videos.forEach(v => {
        v.currentTime = 0;
        v.pause(); 
    });

    // 4. Start Recording Loop
    recorder.start();
    
    // Start playback
    // Start playback
    await Promise.all(videos.map(v => v.play()));
    if (exportAudio) exportAudio.play();

    // --- Animation State Init ---
    // Helper to calculate numerical layout values from abstract settings
    const getLayout = (s) => {
        const padding = (s.padding ?? 40) * scaleFactor;
        
        // 1. Calculate Max Available Area
        const maxW = width - (padding * 2);
        const maxH = height - (padding * 2);

        // 2. Calculate Actual Screen Container (Fit Aspect Ratio)
        // Default to 16:9 if video not ready, but it should be.
        const vidW = (screenVideo && screenVideo.videoWidth) ? screenVideo.videoWidth : 1920;
        const vidH = (screenVideo && screenVideo.videoHeight) ? screenVideo.videoHeight : 1080;
        const vidRatio = vidW / vidH;
        const maxRatio = maxW / maxH;
        
        let sW, sH, sX, sY;
        
        if (vidRatio > maxRatio) {
            // Video is wider than available space -> Fit Width
            sW = maxW;
            sH = maxW / vidRatio;
            sX = padding;
            sY = padding + (maxH - sH) / 2;
        } else {
            // Video is taller -> Fit Height
            sH = maxH;
            sW = maxH * vidRatio;
            sX = padding + (maxW - sW) / 2;
            sY = padding;
        }
        
        const camSize = (s.cameraSize ?? 200) * scaleFactor;
        const isCircle = s.cameraShape === 'circle';
        const camW = camSize;
        const camH = isCircle ? camSize : camSize * (9/16);
        const camRadius = isCircle ? camSize / 2 : (s.cameraBorderRadius ?? 12) * scaleFactor;
        
        // Camera Position (Relative to actual Screen Container)
        const margin = 20 * scaleFactor;
        let camX, camY;
        const pos = s.cameraPosition || 'bottom-left';
        
        switch(pos) {
            case 'top-left': 
                camX = sX + margin; 
                camY = sY + margin; 
                break;
            case 'top-right': 
                camX = sX + sW - camW - margin; 
                camY = sY + margin; 
                break;
            case 'bottom-right': 
                camX = sX + sW - camW - margin; 
                camY = sY + sH - camH - margin; 
                break;
            case 'bottom-left': 
            default:
                camX = sX + margin; 
                camY = sY + sH - camH - margin; 
                break;
        }

        return {
            zoom: s.zoomScale || 1,
            fx: s.focalPointX ?? 50,
            fy: s.focalPointY ?? 50,
            // Layout Props
            sX, sY, sW, sH,
            // Style Props
            sRadius: (s.borderRadius ?? 12) * scaleFactor,
            sShadow: (s.shadow ?? 20) * scaleFactor,
            // Camera Props
            camW, camH, camX, camY, camRadius,
            camShadow: (s.cameraShadow ?? 20) * scaleFactor,
            camOpacity: (s.showCamera ?? true) ? 1 : 0
        };
    };

    // Initialize state with base settings
    let animState = getLayout(baseSettings);

    const lerp = (start, end, t) => start * (1 - t) + end * t;
    const ZOOM_LERP = 0.15; // Smooth cinematic zoom
    const CAM_LERP = 0.3;   // Snappy camera movement
    
    // Sort interactions once
    const sortedInteractions = interactionsData ? [...interactionsData].sort((a,b) => a.timestamp - b.timestamp) : [];

    const drawFrame = () => {
        if (!ctx || !screenVideo) return;

        // Update Progress
        const current = screenVideo.currentTime;
        setProgress((current / duration) * 100);

        if (current >= duration || screenVideo.ended) {
            stopExport(videos, exportAudio);
            return;
        }

        // --- CALC SETTINGS FOR FRAME ---
        const activeOverride = overrides.find(o => current >= o.start && current < o.end);
        const settings = activeOverride 
            ? { ...baseSettings, ...activeOverride.settings } 
            : baseSettings;

        // --- UPDATE ANIMATION STATE ---
        const target = getLayout(settings);
        
        animState.zoom = lerp(animState.zoom, target.zoom, ZOOM_LERP);
        animState.fx = lerp(animState.fx, target.fx, ZOOM_LERP);
        animState.fy = lerp(animState.fy, target.fy, ZOOM_LERP);
        
        // Interpolate Layout
        animState.sX = lerp(animState.sX, target.sX, ZOOM_LERP);
        animState.sY = lerp(animState.sY, target.sY, ZOOM_LERP);
        animState.sW = lerp(animState.sW, target.sW, ZOOM_LERP);
        animState.sH = lerp(animState.sH, target.sH, ZOOM_LERP);
        
        // Interpolate Style
        animState.sRadius = lerp(animState.sRadius, target.sRadius, ZOOM_LERP);
        animState.sShadow = lerp(animState.sShadow, target.sShadow, ZOOM_LERP);
        
        // Interpolate Camera
        animState.camW = lerp(animState.camW, target.camW, CAM_LERP);
        animState.camH = lerp(animState.camH, target.camH, CAM_LERP);
        animState.camX = lerp(animState.camX, target.camX, CAM_LERP);
        animState.camY = lerp(animState.camY, target.camY, CAM_LERP);
        animState.camRadius = lerp(animState.camRadius, target.camRadius, CAM_LERP);
        animState.camShadow = lerp(animState.camShadow, target.camShadow, CAM_LERP);
        animState.camOpacity = lerp(animState.camOpacity, target.camOpacity, CAM_LERP);

        // --- DRAWING LOGIC ---
        
        const backgroundColor = settings.backgroundColor || '#000000';
        // ... (Background drawing logic remains mostly the same, using animState where applicable if we wanted to animate background props, but for now mostly static or simple)
        // Actually background color isn't interpolated here. That's fine for now unless requested.

        // Background
        if (backgroundColor.startsWith('url')) {
            // Image or Pattern Background
            if (backgroundImage) {
                const isPattern = settings.backgroundColor.includes('data:image/svg+xml');
                
                if (isPattern) {
                    // Pattern Logic
                    const pattern = ctx.createPattern(backgroundImage, 'repeat');
                    
                    // Scale Pattern
                    const matrix = new DOMMatrix();
                    // We need to scale the pattern. 
                    // settings.backgroundScale is in pixels (e.g., 100px).
                    // The original SVG size is usually small (e.g., 20px or 40px).
                    // We need to determine the scale factor.
                    // However, background-size in CSS sets the width of the image.
                    // So scale = settings.backgroundScale / backgroundImage.width
                    
                    // Note: We need to account for the export scaleFactor (4x for 8K)
                    // If backgroundScale is 100px on screen, it should be 400px on 8K canvas.
                    
                    const scale = (settings.backgroundScale * scaleFactor) / backgroundImage.width;
                    
                    matrix.scaleSelf(scale, scale);
                    pattern.setTransform(matrix);
                    
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, width, height);
                } else {
                    // Cover Image Logic
                    const imgRatio = backgroundImage.width / backgroundImage.height;
                    const canvasRatio = width / height;
                    let drawW, drawH, drawX, drawY;

                    if (imgRatio > canvasRatio) {
                        drawH = height;
                        drawW = height * imgRatio;
                        drawY = 0;
                        drawX = (width - drawW) / 2;
                    } else {
                        drawW = width;
                        drawH = width / imgRatio;
                        drawX = 0;
                        drawY = (height - drawH) / 2;
                    }
                    ctx.drawImage(backgroundImage, drawX, drawY, drawW, drawH);
                }
            } else {
                // Fallback
                ctx.fillStyle = '#171717';
                ctx.fillRect(0, 0, width, height);
            }
        } else if (backgroundColor.startsWith('linear-gradient')) {
            // Gradient Background
            // Parse simple 2-stop gradient: linear-gradient(135deg, COLOR1 0%, COLOR2 100%)
            const colors = backgroundColor.match(/#[a-fA-F0-9]{6}/g);
            if (colors && colors.length >= 2) {
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, colors[0]);
                gradient.addColorStop(1, colors[1]);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            } else {
                // Fallback if parse fails
                ctx.fillStyle = '#171717';
                ctx.fillRect(0, 0, width, height);
            }
        } else {
            // Solid Color
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }

        // Use animState for layout variables - Now derived from Fitted Screen Container
        const screenX = animState.sX;
        const screenY = animState.sY;
        const contentWidth = animState.sW;
        const contentHeight = animState.sH;

        // Draw Screen Container Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = animState.sShadow * 2;
        ctx.shadowOffsetY = animState.sShadow;
        
        // Draw Screen Container Background (Black)
        ctx.fillStyle = '#000000';
        
        // Rounded Rect for Screen
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, contentWidth, contentHeight, animState.sRadius);
        ctx.fill();
        ctx.restore();

        // Clip for Screen Video
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, contentWidth, contentHeight, animState.sRadius);
        ctx.clip();

        // Draw Screen Video (Contain)
        // Since we calculated sW/sH to fit the video ratio, we just draw fully into sX,sY,sW,sH
        
        const drawW = contentWidth;
        const drawH = contentHeight;
        const drawX = screenX;
        const drawY = screenY;
        
        // Apply Zoom & Pan
        // Use interpolated values
        const zoom = animState.zoom;
        const fx = animState.fx;
        const fy = animState.fy;

        // Calculate translation (same logic as Canvas.jsx)
        let txPercent = 50 - (fx * zoom);
        let tyPercent = 50 - (fy * zoom);

        // Clamp values
        const minTranslate = 100 * (1 - zoom);
        const maxTranslate = 0;

        txPercent = Math.min(maxTranslate, Math.max(minTranslate, txPercent));
        tyPercent = Math.min(maxTranslate, Math.max(minTranslate, tyPercent));
        
        // Convert percent to pixels relative to the DRAWN video size
        // Note: transform-origin is 0 0 in CSS, so we translate then scale.
        // In CSS: translate(tx%, ty%) scale(zoom)
        // Here we deal with the specific video rect (drawX, drawY, drawW, drawH)
        
        const txPx = (txPercent / 100) * drawW;
        const tyPx = (tyPercent / 100) * drawH;

        ctx.save();
        // 1. Move to the top-left of where the video SHOULD be
        ctx.translate(drawX, drawY);
        // 2. Apply the calculated translation
        ctx.translate(txPx, tyPx);
        // 3. Apply scale
        ctx.scale(zoom, zoom);
        // 4. Draw video at 0,0 (relative to the translated origin)
        ctx.drawImage(screenVideo, 0, 0, drawW, drawH);
        
        // --- DRAW INTERACTIONS (Mouse & Keyboard) ---
        if ((settings.showInteractions ?? true) && sortedInteractions.length > 0) {
            // Find current mouse events (closest one recently)
            const recentEvents = sortedInteractions.filter(e => e.timestamp <= current && e.timestamp > current - 0.1);
            const mouseEvent = recentEvents.find(e => !e.type || e.type === 'mousemove' || e.type === 'click');
            
            // Draw Mouse
            if (mouseEvent) {
                // Scale coordinates
                // Mouse coordinates are likely in screen pixels (1920x1080).
                // We are drawing the screenVideo into drawW x drawH.
                const scaleX = drawW / screenVideo.videoWidth;
                const scaleY = drawH / screenVideo.videoHeight;
                
                const mx = mouseEvent.x * scaleX;
                const my = mouseEvent.y * scaleY;
                
                const radius = (mouseEvent.type === 'click' ? 12 : 8) * scaleFactor; // larger for click
                
                ctx.beginPath();
                ctx.arc(mx, my, radius, 0, Math.PI * 2);
                ctx.fillStyle = mouseEvent.type === 'click' ? '#ef4444' : 'rgba(239, 68, 68, 0.5)'; // red-500
                ctx.fill();
            }
        }
        
        ctx.restore(); // Restore transform (Zoom)
        
        // --- DRAW KEYBOARD INTERACTIONS (Overlaid on top, not zoomed) ---
        // Group logic similar to InteractionVisualizer
        if ((settings.showInteractions ?? true) && sortedInteractions.length > 0) {
            // We need to look back a bit further for range
            const windowEvents = sortedInteractions.filter(e => 
                (e.type === 'keydown' || e.type === 'keypress') && 
                e.timestamp <= current && 
                e.timestamp > current - 3.0 // Look back 3s
            );
            
            if (windowEvents.length > 0) {
                 // Simple grouping strategy: grab the last group that is still "visible"
                 // A group ends if gap > 1s.
                 const groups = [];
                 let currentGroup = [];
                 
                 windowEvents.forEach((e, i) => {
                      const prev = windowEvents[i-1];
                      if (prev && (e.timestamp - prev.timestamp > 1.0)) {
                          groups.push(currentGroup);
                          currentGroup = [];
                      }
                      currentGroup.push(e);
                 });
                 if (currentGroup.length > 0) groups.push(currentGroup);
                 
                 // Process groups to find valid displayable text
                 const displayableGroups = groups.map(group => {
                     let text = '';
                     const specialKeys = {
                        'Backspace': '⌫', 'Enter': '⏎', 'ArrowUp': '↑', 'ArrowDown': '↓', 
                        'ArrowLeft': '←', 'ArrowRight': '→', 'Escape': '⎋', 'Tab': '⇥', 
                        'Shift': '⇧', 'Control': '⌃', 'Alt': '⌥', 'Meta': '⌘', 'CapsLock': '⇪'
                     };
                     group.forEach(e => {
                         if (specialKeys[e.key]) text += specialKeys[e.key];
                         else if (e.key === 'Space' || e.key === ' ') text += ' ';
                         else if (e.key.length === 1) text += e.key;
                     });
                     
                     const lastTime = group[group.length - 1].timestamp;
                     const age = current - lastTime;
                     const isVisible = age < 1.5;
                     
                     return { text, isVisible, age };
                 }).filter(g => g.isVisible && g.text.length > 0);
                 
                 // Draw the most recent group(s)
                 // Stack them from bottom
                 const startY = height - (150 * scaleFactor); // Bottom offset
                 
                 displayableGroups.forEach((g, i) => {
                     if (i > 0) return; // Only show last group for cleaner look? or stack? InteractionVisualizer stacks.
                     
                     // Draw bubble
                     ctx.font = `bold ${32 * scaleFactor}px Inter, sans-serif`;
                     const textMetrics = ctx.measureText(g.text);
                     const paddingX = 24 * scaleFactor;
                     const paddingY = 12 * scaleFactor;
                     const boxW = textMetrics.width + (paddingX * 2);
                     const boxH = (32 * scaleFactor) + (paddingY * 2); // approx
                     const x = (width - boxW) / 2;
                     const y = startY - (i * (boxH + 20));
                     
                     // Fade out
                     const alpha = g.age > 1.0 ? (1.5 - g.age) / 0.5 : 1.0;
                     if (alpha <= 0) return;
                     
                     ctx.save();
                     ctx.globalAlpha = alpha;
                     
                     // Background
                     ctx.fillStyle = 'rgba(23, 23, 23, 0.9)'; // neutral-900/90
                     ctx.beginPath();
                     ctx.roundRect(x, y, boxW, boxH, 12 * scaleFactor);
                     ctx.fill();
                     
                     // Border
                     ctx.strokeStyle = 'rgba(64, 64, 64, 0.5)'; // neutral-700/50
                     ctx.lineWidth = 1 * scaleFactor;
                     ctx.stroke();
                     
                     // Text
                     ctx.fillStyle = '#ffffff';
                     ctx.textBaseline = 'middle';
                     ctx.fillText(g.text, x + paddingX, y + (boxH/2));
                     
                     ctx.restore();
                 });
            }
        }

        ctx.restore(); // Restore clip

        // Draw Camera PiP
        if (settings.showCamera && cameraVideo && animState.camOpacity > 0.01) {
            ctx.globalAlpha = animState.camOpacity;
            
            const camW = animState.camW;
            const camH = animState.camH;
            const camX = animState.camX;
            const camY = animState.camY;
            const camRadius = animState.camRadius;
            const camShadow = animState.camShadow;

            // Camera Shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = camShadow * 2;
            ctx.shadowOffsetY = camShadow;

            // Camera Shape Clip & Fill
            ctx.beginPath();
            ctx.roundRect(camX, camY, camW, camH, camRadius);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.restore(); 

            // Clip for Camera Video
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(camX, camY, camW, camH, camRadius);
            ctx.clip();

            // Draw Camera Video (Cover)
            const camVidRatio = cameraVideo.videoWidth / cameraVideo.videoHeight;
            const camTargetRatio = camW / camH;
            
            let cDrawW, cDrawH, cDrawX, cDrawY;
            
            if (camVidRatio > camTargetRatio) {
                cDrawH = camH;
                cDrawW = camH * camVidRatio;
                cDrawY = camY;
                cDrawX = camX - (cDrawW - camW) / 2;
            } else {
                cDrawW = camW;
                cDrawH = camW / camVidRatio;
                cDrawX = camX;
                cDrawY = camY - (cDrawH - camH) / 2;
            }

            ctx.drawImage(cameraVideo, cDrawX, cDrawY, cDrawW, cDrawH);
            ctx.restore();
            
            ctx.globalAlpha = 1.0;
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const stopExport = (videos, exportAudio) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    videos.forEach(v => v.pause());
    if (exportAudio) exportAudio.pause();
  };

  return {
    isExporting,
    progress,
    startExport
  };
};

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
    settings, 
    duration,
    onComplete 
  }) => {
    if (!screenVideo || !duration) return;

    setIsExporting(true);
    setProgress(0);
    chunksRef.current = [];

    // 1. Setup Canvas (8K Resolution)
    const width = 7680;
    const height = 4320;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    // Scale Factor (Design is based on ~1080p logic, so we scale up for 8K)
    const scaleFactor = 4; 

    // Preload Background Image if needed
    let backgroundImage = null;
    if (settings.backgroundColor.startsWith('url')) {
        const url = settings.backgroundColor.match(/url\(['"]?(.*?)['"]?\)/)[1];
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
    if (audioElement) {
        const audioContext = new AudioContext();
        const dest = audioContext.createMediaStreamDestination();
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(dest);
        
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
        setIsExporting(false);
        if (onComplete) onComplete();
    };

    mediaRecorderRef.current = recorder;

    // 3. Prepare Playback
    const videos = [screenVideo];
    if (cameraVideo) videos.push(cameraVideo);
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.volume = 1.0; 
    }

    videos.forEach(v => {
        v.currentTime = 0;
        v.pause(); 
    });

    // 4. Start Recording Loop
    recorder.start();
    
    // Start playback
    await Promise.all(videos.map(v => v.play()));
    if (audioElement) audioElement.play();

    const drawFrame = () => {
        if (!ctx || !screenVideo) return;

        // Update Progress
        const current = screenVideo.currentTime;
        setProgress((current / duration) * 100);

        if (current >= duration || screenVideo.ended) {
            stopExport(videos, audioElement);
            return;
        }

        // --- DRAWING LOGIC ---
        
        // --- DRAWING LOGIC ---
        
        // Background
        if (settings.backgroundColor.startsWith('url')) {
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
        } else if (settings.backgroundColor.startsWith('linear-gradient')) {
            // Gradient Background
            // Parse simple 2-stop gradient: linear-gradient(135deg, COLOR1 0%, COLOR2 100%)
            const colors = settings.backgroundColor.match(/#[a-fA-F0-9]{6}/g);
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
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }

        // Apply Scale to Settings
        const sPadding = settings.padding * scaleFactor;
        const sBorderRadius = settings.borderRadius * scaleFactor;
        const sShadow = settings.shadow * scaleFactor;
        
        const contentWidth = width - (sPadding * 2);
        const contentHeight = height - (sPadding * 2);
        
        const screenX = sPadding;
        const screenY = sPadding;

        // Draw Screen Container Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = sShadow * 2;
        ctx.shadowOffsetY = sShadow;
        
        // Draw Screen Container Background (Black)
        ctx.fillStyle = '#000000';
        
        // Rounded Rect for Screen
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, contentWidth, contentHeight, sBorderRadius);
        ctx.fill();
        ctx.restore();

        // Clip for Screen Video
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, contentWidth, contentHeight, sBorderRadius);
        ctx.clip();

        // Draw Screen Video (Contain)
        const vidRatio = screenVideo.videoWidth / screenVideo.videoHeight;
        const targetRatio = contentWidth / contentHeight;
        
        let drawW, drawH, drawX, drawY;
        
        if (vidRatio > targetRatio) {
            drawW = contentWidth;
            drawH = contentWidth / vidRatio;
            drawX = screenX;
            drawY = screenY + (contentHeight - drawH) / 2;
        } else {
            drawH = contentHeight;
            drawW = contentHeight * vidRatio;
            drawY = screenY;
            drawX = screenX + (contentWidth - drawW) / 2;
        }

        ctx.drawImage(screenVideo, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Draw Camera PiP
        if (settings.showCamera && cameraVideo) {
            const sCameraSize = settings.cameraSize * scaleFactor; 
            const sCameraShadow = settings.cameraShadow * scaleFactor;
            const sCameraBorderRadius = settings.cameraBorderRadius * scaleFactor;
            
            // Assuming margin is also scaled? Let's use a fixed margin scaled up.
            const camMargin = 20 * scaleFactor; 
            
            let camW = sCameraSize;
            let camH = settings.cameraShape === 'circle' ? sCameraSize : sCameraSize * (9/16);
            
            let camX, camY;
            
            // Positioning
            switch(settings.cameraPosition) {
                case 'top-left': 
                    camX = screenX + camMargin; 
                    camY = screenY + camMargin; 
                    break;
                case 'top-right': 
                    camX = screenX + contentWidth - camW - camMargin; 
                    camY = screenY + camMargin; 
                    break;
                case 'bottom-right': 
                    camX = screenX + contentWidth - camW - camMargin; 
                    camY = screenY + contentHeight - camH - camMargin; 
                    break;
                case 'bottom-left': 
                default:
                    camX = screenX + camMargin; 
                    camY = screenY + contentHeight - camH - camMargin; 
                    break;
            }

            // Camera Shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = sCameraShadow * 2;
            ctx.shadowOffsetY = sCameraShadow;

            // Camera Shape Clip & Fill
            ctx.beginPath();
            if (settings.cameraShape === 'circle') {
                ctx.arc(camX + camW/2, camY + camH/2, camW/2, 0, Math.PI * 2);
            } else {
                ctx.roundRect(camX, camY, camW, camH, sCameraBorderRadius);
            }
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.restore(); 

            // Clip for Camera Video
            ctx.save();
            ctx.beginPath();
            if (settings.cameraShape === 'circle') {
                ctx.arc(camX + camW/2, camY + camH/2, camW/2, 0, Math.PI * 2);
            } else {
                ctx.roundRect(camX, camY, camW, camH, sCameraBorderRadius);
            }
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
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const stopExport = (videos, audioElement) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    videos.forEach(v => v.pause());
    if (audioElement) audioElement.pause();
  };

  return {
    isExporting,
    progress,
    startExport
  };
};

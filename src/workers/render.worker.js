import {
  Output,
  CanvasSource,
  AudioSampleSource,
  AudioSample,
  WebMOutputFormat,
  BufferTarget,
} from "mediabunny";

// Global State
let ctx = null;
let animState = null;
let sortedInteractions = [];
let backgroundImageBitmap = null;
let width = 3840;
let height = 2160;
let scaleFactor = 2;

// Mediabunny State
let output = null;
let videoSource = null;
let audioSource = null;
// let audioGenerator = null; // Removed
// let audioWriter = null; // Removed

// Audio State (Interleaved)
let currentAudioBuffer = null;
let audioSampleIndex = 0;

const ZOOM_LERP = 0.15;
const CAM_LERP = 0.3;

const lerp = (start, end, t) => start * (1 - t) + end * t;

const getLayout = (s, screenVideoW, screenVideoH) => {
  const padding = (s.padding ?? 40) * scaleFactor;

  const maxW = width - padding * 2;
  const maxH = height - padding * 2;

  const vidW = screenVideoW || 1920;
  const vidH = screenVideoH || 1080;
  const vidRatio = vidW / vidH;
  const maxRatio = maxW / maxH;

  let sW, sH, sX, sY;

  if (vidRatio > maxRatio) {
    sW = maxW;
    sH = maxW / vidRatio;
    sX = padding;
    sY = padding + (maxH - sH) / 2;
  } else {
    sH = maxH;
    sW = maxH * vidRatio;
    sX = padding + (maxW - sW) / 2;
    sY = padding;
  }

  const camSize = (s.cameraSize ?? 200) * scaleFactor;
  const isCircle = s.cameraShape === "circle";
  const camW = camSize;
  const camH = isCircle ? camSize : camSize * (9 / 16);
  const camRadius = isCircle
    ? camSize / 2
    : (s.cameraBorderRadius ?? 12) * scaleFactor;

  const margin = 20 * scaleFactor;
  let camX, camY;
  const pos = s.cameraPosition || "bottom-left";

  switch (pos) {
    case "top-left":
      camX = sX + margin;
      camY = sY + margin;
      break;
    case "top-right":
      camX = sX + sW - camW - margin;
      camY = sY + margin;
      break;
    case "bottom-right":
      camX = sX + sW - camW - margin;
      camY = sY + sH - camH - margin;
      break;
    case "bottom-left":
    default:
      camX = sX + margin;
      camY = sY + sH - camH - margin;
      break;
  }

  return {
    zoom: s.zoomScale || 1,
    fx: s.focalPointX ?? 50,
    fy: s.focalPointY ?? 50,
    sX,
    sY,
    sW,
    sH,
    sRadius: (s.borderRadius ?? 12) * scaleFactor,
    sShadow: (s.shadow ?? 20) * scaleFactor,
    camW,
    camH,
    camX,
    camY,
    camRadius,
    camShadow: (s.cameraShadow ?? 20) * scaleFactor,
    camOpacity: s.showCamera ?? true ? 1 : 0,
  };
};

// Handle Messages
self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === "INIT") {
    const {
      canvas,
      settings,
      interactionsData,
      backgroundImage,
      config,
      audioBuffers,
    } = payload;

    if (canvas) {
      ctx = canvas.getContext("2d", {
        desynchronized: true,
      });
      width = canvas.width;
      height = canvas.height;
    }
    if (config) {
      scaleFactor = config.scaleFactor || 2;
    }

    sortedInteractions = interactionsData
      ? [...interactionsData].sort((a, b) => a.timestamp - b.timestamp)
      : [];

    if (backgroundImage) {
      backgroundImageBitmap = backgroundImage;
    }

    animState = getLayout(settings, 1920, 1080);

    // --- Setup Mediabunny ---
    output = new Output({
      format: new WebMOutputFormat(),
      target: new BufferTarget(),
    });

    // Add Video Track
    videoSource = new CanvasSource(canvas, {
      codec: "vp9",
      bitrate: 60_000_000,
      width: width,
      height: height,
    });

    output.addVideoTrack(videoSource, { frameRate: 60 });

    // Setup Audio Track (Stored for Interleaved Writing)
    if (audioBuffers && audioBuffers.length > 0) {
      console.log("Worker: Storing audio buffer for interleaved writing.");
      // Assume single buffer for now (simplification)
      currentAudioBuffer = audioBuffers[0]; 
      
      const offset = currentAudioBuffer.offset || 0;
      const sr = currentAudioBuffer.sampleRate || 48000;
      
      // If offset is negative, the audio starts BEFORE the video.
      // We must skip the first part of the audio so that the first sample we write corresponds to t=0.
      // Index = (-offset) * sr
      if (offset < 0) {
          audioSampleIndex = Math.floor(-offset * sr);
          // Clamp to ensure we don't start past the end
          audioSampleIndex = Math.min(audioSampleIndex, currentAudioBuffer.data.length);
          console.log("Worker: Negative offset detected. Skipping initial samples.", { offset, audioSampleIndex });
      } else {
          audioSampleIndex = 0;
      }

      const sampleRate = currentAudioBuffer.sampleRate || 48000;
      console.log("Worker: Initializing Audio Source (AudioSampleSource)", { sampleRate });

      // Use AudioSampleSource which doesn't require MediaStreamTrackGenerator
      audioSource = new AudioSampleSource({
        codec: "opus",
        bitrate: 128_000,
        numberOfChannels: 1, 
        sampleRate: sampleRate,
      });
      output.addAudioTrack(audioSource);
    } else {
         console.warn("Worker: No audio buffers found", { 
             buffers: audioBuffers?.length
         });
    }

    await output.start();
  }

  if (type === "RENDER_FRAME") {
    if (!ctx || !animState || !videoSource) return;

    const { screenBitmap, cameraBitmap, timestamp, baseSettings, overrides } =
      payload;

    // --- AUDIO WRITING (INTERLEAVED) ---
    // Logically, we want to write audio corresponding to this frame's duration.
    // Frame duration is 1/60s.
    const frameDuration = 1 / 60;
    
    if (audioSource && currentAudioBuffer) {
        const sr = currentAudioBuffer.sampleRate;
        const totalSamples = currentAudioBuffer.data.length;
        const offset = currentAudioBuffer.offset || 0; // Get offset here
        
        // Target sample index based on the *end* of this frame
        // (timestamp is start of frame, so we want to cover up to timestamp + frameDuration)
        const targetTime = timestamp + frameDuration;
        
        // Calculate which sample index corresponds to targetTime
        // time = offset + index / sr  =>  index = (time - offset) * sr
        const targetSampleIndex = Math.floor((targetTime - offset) * sr);
        
        // Determine range to write
        // We start from wherever we left off (audioSampleIndex).
        // If audioSampleIndex is 0 and targetSampleIndex is negative (because we are before the offset), we clamp end to 0 (or start).
        // Effectively:
        let start = audioSampleIndex;
        // If we haven't reached the audio start yet, start might be 0, and targetSampleIndex negative.
        // We shouldn't decrement audioSampleIndex.
        
        const end = Math.min(Math.max(0, targetSampleIndex), totalSamples);
        const count = end - start;
        
        if (count > 0) {
            const chunkData = currentAudioBuffer.data.slice(start, end);
            
            // Timestamp for AudioSample: Start timestamp in seconds
            // Must account for the buffer's start time (offset)
            let chunkTime = offset + (start / sr); 
            
            // Safety: Ensure we never send negative timestamp to muxer
            if (chunkTime < 0) {
                // This shouldn't happen if audioSampleIndex is initialized correctly for negative offsets,
                // but float precision might give -0.000001.
                chunkTime = 0;
            }

            const audioSample = new AudioSample({
                sampleRate: sr,
                numberOfChannels: 1,
                numberOfFrames: chunkData.length,
                timestamp: chunkTime,
                data: chunkData, 
                format: 'f32-planar' 
            });
            
            
            // Debug Interleaved Audio
            // console.log(`Worker: Audio Write | TS: ${chunkTime.toFixed(3)} | Count: ${count}`);

            await audioSource.add(audioSample);
            
            audioSampleIndex = end;
        } else {
             // console.warn(`Worker: No audio to write for frame.`, { timestamp, targetTime: timestamp + frameDuration, start: audioSampleIndex, end: Math.floor((timestamp + frameDuration) * sr) });
        }
    } else {
        if (!audioSource) console.warn("Worker: Audio source not ready");
        if (!currentAudioBuffer) console.warn("Worker: No audio buffer");
    }

    // --- DRAWING ---
    const activeOverride = overrides.find(
      (o) => timestamp >= o.start && timestamp < o.end
    );
    const settings = activeOverride
      ? { ...baseSettings, ...activeOverride.settings }
      : baseSettings;

    const vidW = screenBitmap ? screenBitmap.width : 1920;
    const vidH = screenBitmap ? screenBitmap.height : 1080;
    const target = getLayout(settings, vidW, vidH);

    animState.zoom = lerp(animState.zoom, target.zoom, ZOOM_LERP);
    animState.fx = lerp(animState.fx, target.fx, ZOOM_LERP);
    animState.fy = lerp(animState.fy, target.fy, ZOOM_LERP);
    animState.sX = lerp(animState.sX, target.sX, ZOOM_LERP);
    animState.sY = lerp(animState.sY, target.sY, ZOOM_LERP);
    animState.sW = lerp(animState.sW, target.sW, ZOOM_LERP);
    animState.sH = lerp(animState.sH, target.sH, ZOOM_LERP);
    animState.sRadius = lerp(animState.sRadius, target.sRadius, ZOOM_LERP);
    animState.sShadow = lerp(animState.sShadow, target.sShadow, ZOOM_LERP);
    animState.camW = lerp(animState.camW, target.camW, CAM_LERP);
    animState.camH = lerp(animState.camH, target.camH, CAM_LERP);
    animState.camX = lerp(animState.camX, target.camX, CAM_LERP);
    animState.camY = lerp(animState.camY, target.camY, CAM_LERP);
    animState.camRadius = lerp(animState.camRadius, target.camRadius, CAM_LERP);
    animState.camShadow = lerp(animState.camShadow, target.camShadow, CAM_LERP);
    animState.camOpacity = lerp(
      animState.camOpacity,
      target.camOpacity,
      CAM_LERP
    );

    // -- Draw Background --
    const backgroundColor = settings.backgroundColor || "#000000";
    if (backgroundColor.startsWith("url") && backgroundImageBitmap) {
      const isPattern = settings.backgroundColor.includes("data:image/svg+xml");
      if (isPattern) {
        const pattern = ctx.createPattern(backgroundImageBitmap, "repeat");
        const matrix = new DOMMatrix();
        const scale =
          (settings.backgroundScale * scaleFactor) /
          backgroundImageBitmap.width;
        matrix.scaleSelf(scale, scale);
        pattern.setTransform(matrix);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      } else {
        const imgRatio =
          backgroundImageBitmap.width / backgroundImageBitmap.height;
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
        ctx.drawImage(backgroundImageBitmap, drawX, drawY, drawW, drawH);
      }
    } else if (backgroundColor.startsWith("linear-gradient")) {
      const colors = backgroundColor.match(/#[a-fA-F0-9]{6}/g);
      if (colors && colors.length >= 2) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = "#171717";
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // -- Draw Content --
    const { sX, sY, sW, sH, sRadius, sShadow } = animState;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = sShadow * 2;
    ctx.shadowOffsetY = sShadow;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(sX, sY, sW, sH, sRadius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(sX, sY, sW, sH, sRadius);
    ctx.clip();

    if (screenBitmap) {
      const zoom = animState.zoom;
      let txPercent = 50 - animState.fx * zoom;
      let tyPercent = 50 - animState.fy * zoom;
      const minTranslate = 100 * (1 - zoom);
      txPercent = Math.min(0, Math.max(minTranslate, txPercent));
      tyPercent = Math.min(0, Math.max(minTranslate, tyPercent));
      const txPx = (txPercent / 100) * sW;
      const tyPx = (tyPercent / 100) * sH;

      ctx.save();
      ctx.translate(sX, sY);
      ctx.translate(txPx, tyPx);
      ctx.scale(zoom, zoom);
      ctx.drawImage(screenBitmap, 0, 0, sW, sH);

      // Mouse
      if (
        (settings.showInteractions ?? true) &&
        sortedInteractions.length > 0
      ) {
        const current = timestamp;
        const recentEvents = sortedInteractions.filter(
          (e) => e.timestamp <= current && e.timestamp > current - 0.1
        );
        const mouseEvent = recentEvents.find(
          (e) => !e.type || e.type === "mousemove" || e.type === "click"
        );
        if (mouseEvent) {
          const scaleX = sW / vidW;
          const scaleY = sH / vidH;
          const mx = mouseEvent.x * scaleX;
          const my = mouseEvent.y * scaleY;
          const radius = (mouseEvent.type === "click" ? 12 : 8) * scaleFactor;
          ctx.beginPath();
          ctx.arc(mx, my, radius, 0, Math.PI * 2);
          ctx.fillStyle =
            mouseEvent.type === "click" ? "#ef4444" : "rgba(239, 68, 68, 0.5)";
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Keyboard
    if ((settings.showInteractions ?? true) && sortedInteractions.length > 0) {
      const current = timestamp;
      const windowEvents = sortedInteractions.filter(
        (e) =>
          (e.type === "keydown" || e.type === "keypress") &&
          e.timestamp <= current &&
          e.timestamp > current - 3.0
      );
      if (windowEvents.length > 0) {
        const groups = [];
        let currentGroup = [];
        windowEvents.forEach((e, i) => {
          const prev = windowEvents[i - 1];
          if (prev && e.timestamp - prev.timestamp > 1.0) {
            groups.push(currentGroup);
            currentGroup = [];
          }
          currentGroup.push(e);
        });
        if (currentGroup.length > 0) groups.push(currentGroup);
        const displayableGroups = groups
          .map((group) => {
            let text = "";
            const specialKeys = {
              Backspace: "⌫",
              Enter: "⏎",
              ArrowUp: "↑",
              ArrowDown: "↓",
              ArrowLeft: "←",
              ArrowRight: "→",
              Escape: "⎋",
              Tab: "⇥",
              Shift: "⇧",
              Control: "⌃",
              Alt: "⌥",
              Meta: "⌘",
              CapsLock: "⇪",
            };
            group.forEach((e) => {
              if (specialKeys[e.key]) text += specialKeys[e.key];
              else if (e.key === "Space" || e.key === " ") text += " ";
              else if (e.key.length === 1) text += e.key;
            });
            const lastTime = group[group.length - 1].timestamp;
            const age = current - lastTime;
            return { text, isVisible: age < 1.5, age };
          })
          .filter((g) => g.isVisible && g.text.length > 0);

        const startY = height - 150 * scaleFactor;
        displayableGroups.forEach((g, i) => {
          if (i > 0) return;
          ctx.font = `bold ${32 * scaleFactor}px Inter, sans-serif`;
          const textMetrics = ctx.measureText(g.text);
          const boxW = textMetrics.width + 48 * scaleFactor;
          const boxH = 32 * scaleFactor + 24 * scaleFactor;
          const x = (width - boxW) / 2;
          const y = startY - i * (boxH + 20);
          const alpha = g.age > 1.0 ? (1.5 - g.age) / 0.5 : 1.0;
          if (alpha <= 0) return;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "rgba(23, 23, 23, 0.9)";
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, boxH, 12 * scaleFactor);
          ctx.fill();
          ctx.strokeStyle = "rgba(64, 64, 64, 0.5)";
          ctx.lineWidth = 1 * scaleFactor;
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.textBaseline = "middle";
          ctx.fillText(g.text, x + 24 * scaleFactor, y + boxH / 2);
          ctx.restore();
        });
      }
    }
    ctx.restore(); // Screen clip

    // PiP
    if (settings.showCamera && cameraBitmap && animState.camOpacity > 0.01) {
      ctx.globalAlpha = animState.camOpacity;
      const { camW, camH, camX, camY, camRadius, camShadow } = animState;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = camShadow * 2;
      ctx.shadowOffsetY = camShadow;
      ctx.beginPath();
      ctx.roundRect(camX, camY, camW, camH, camRadius);
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(camX, camY, camW, camH, camRadius);
      ctx.clip();
      const camVidRatio = cameraBitmap.width / cameraBitmap.height;
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
      ctx.drawImage(cameraBitmap, cDrawX, cDrawY, cDrawW, cDrawH);
      ctx.restore();
      ctx.globalAlpha = 1.0;
    }

    // --- ENCODE VIDEO ---
    // Feed the frame to Mediabunny's source
    await videoSource.add(timestamp, frameDuration);

    // Cleanup Textures
    if (screenBitmap) screenBitmap.close();
    if (cameraBitmap) cameraBitmap.close();

    // Notify done
    self.postMessage({ type: "FRAME_DONE", timestamp });
  }

  if (type === "FINISH") {
    if (output) {
      await output.finalize();
      const { buffer } = output.target;
      self.postMessage({ type: "DONE", buffer }, [buffer]);
    }
  }
};

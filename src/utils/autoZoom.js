/**
 * Analyzes interaction data to generate zoom overrides.
 * 
 * @param {Array} interactions - Array of interaction events { type, x, y, timestamp }
 * @param {number} duration - Total duration of the video
 * @param {number} width - Original width of the video source
 * @param {number} height - Original height of the video source
 * @returns {Array} - Array of override objects
 */
export const generateZoomOverrides = (interactions, duration, width, height) => {
    if (!interactions || interactions.length === 0 || !width || !height) return [];

    const overrides = [];
    const ZOOM_SCALE = 1.5;
    const STABILITY_THRESHOLD = 100; // pixels squared (distance squared)
    const DURATION_THRESHOLD = 1.0; // seconds
    const PADDING = 0.5; // seconds before/after

    // Sort events by timestamp
    const sortedEvents = [...interactions].sort((a, b) => a.timestamp - b.timestamp);

    let segmentStart = sortedEvents[0];
    let segmentEvents = [segmentStart];

    const createOverride = (start, end, events) => {
        // Calculate average position
        const avgX = events.reduce((sum, e) => sum + e.x, 0) / events.length;
        const avgY = events.reduce((sum, e) => sum + e.y, 0) / events.length;

        // Convert to percentages
        const focalXPercent = (avgX / width) * 100;
        const focalYPercent = (avgY / height) * 100;

        // Clamp percentages to 0-100
        const clampedX = Math.max(0, Math.min(100, focalXPercent));
        const clampedY = Math.max(0, Math.min(100, focalYPercent));

        return {
            id: crypto.randomUUID(),
            start: Math.max(0, start - PADDING),
            end: Math.min(duration, end + PADDING),
            settings: {
                name: `Auto Zoom ${overrides.length + 1}`,
                zoomScale: ZOOM_SCALE,
                focalPointX: Math.round(clampedX),
                focalPointY: Math.round(clampedY),
                // Inherit defaults to ensure other things don't break
                showScreen: true,
                showCamera: true,
                showInteractions: true
            }
        };
    };

    for (let i = 1; i < sortedEvents.length; i++) {
        const event = sortedEvents[i];
        const prevEvent = sortedEvents[i-1];

        // Check distance from the start of the segment
        const dx = event.x - segmentStart.x;
        const dy = event.y - segmentStart.y;
        const distSq = dx*dx + dy*dy;

        if (distSq < STABILITY_THRESHOLD) {
            segmentEvents.push(event);
        } else {
            // Segment ended, check if it was long enough
            const segmentDuration = prevEvent.timestamp - segmentStart.timestamp;
            
            if (segmentDuration >= DURATION_THRESHOLD) {
                overrides.push(createOverride(segmentStart.timestamp, prevEvent.timestamp, segmentEvents));
            }

            // Start new segment
            segmentStart = event;
            segmentEvents = [event];
        }
    }

    // Check last segment
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const lastSegmentDuration = lastEvent.timestamp - segmentStart.timestamp;
    if (lastSegmentDuration >= DURATION_THRESHOLD) {
         overrides.push(createOverride(segmentStart.timestamp, lastEvent.timestamp, segmentEvents));
    }

    return overrides;
};

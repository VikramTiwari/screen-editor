import React, { useEffect, useRef } from 'react';

const AudioBoostController = ({ audioRef, volume = 1.0 }) => {
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!audioRef.current || initializedRef.current) return;

        // Try to initialize immediately if possible, or wait for interaction
        // Web Audio API requires user interaction to start context in some browsers,
        // but creating nodes usually works.

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();

            gainNodeRef.current = audioContextRef.current.createGain();

            // Connect to destination
            gainNodeRef.current.connect(audioContextRef.current.destination);

            // Create source from element
            // Note: MediaElementSourceNode can only be created once per element.
            // If the element is reused, we must reuse the source or handle error.
            // React strict mode might cause double init.
            try {
                sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                sourceNodeRef.current.connect(gainNodeRef.current);
                initializedRef.current = true;
            } catch (e) {
                // If already connected, we might fail here.
                console.warn("AudioBoostController: MediaElementSource creation failed (maybe already connected):", e);
            }

        } catch (e) {
            console.error("AudioBoostController: Setup failed", e);
        }

        return () => {
            // Cleanup
            // Closing context frees hardware resources
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [audioRef]);

    // Handle Volume Update
    useEffect(() => {
        if (gainNodeRef.current) {
            // Smooth transition
            const currentTime = audioContextRef.current?.currentTime || 0;
            try {
                gainNodeRef.current.gain.setValueAtTime(volume, currentTime);
            } catch (e) {
                // Fallback
                gainNodeRef.current.gain.value = volume;
            }
        }
    }, [volume]);

    // Resume context on volume change or component mount if needed
    useEffect(() => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
             audioContextRef.current.resume().catch(e => console.warn("AudioContext resume failed", e));
        }
    }, [volume]);

    return null;
};

export default AudioBoostController;

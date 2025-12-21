import React, { useEffect, useRef } from 'react';

const AudioBoostController = ({ audioRef, volume = 1.0, isPlaying = false }) => {
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        console.log("AudioBoostController: Effect triggered");
        if (!audioRef.current) {
            console.warn("AudioBoostController: audioRef.current is null");
            return;
        }

        const initAudio = () => {
             console.log("AudioBoostController: initAudio called");
             try {
                // Check if context already exists on the element to handle React Strict Mode / Re-mounts
                if (audioRef.current._audioBoostContext) {
                    console.log("AudioBoostController: Reusing existing context");
                    audioContextRef.current = audioRef.current._audioBoostContext;
                    sourceNodeRef.current = audioRef.current._audioBoostSource;
                    gainNodeRef.current = audioRef.current._audioBoostGain;
                    initializedRef.current = true;
                    return;
                }

                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                audioContextRef.current = ctx;

                const gain = ctx.createGain();
                gainNodeRef.current = gain;

                gain.connect(ctx.destination);

                const source = ctx.createMediaElementSource(audioRef.current);
                sourceNodeRef.current = source;
                source.connect(gain);

                // Attach to element for reuse
                audioRef.current._audioBoostContext = ctx;
                audioRef.current._audioBoostSource = source;
                audioRef.current._audioBoostGain = gain;

                initializedRef.current = true;
            } catch (e) {
                console.error("AudioBoostController: Setup failed", e);
            }
        };

        if (audioRef.current) {
            initAudio();
        } else {
            // Retry once after a short delay in case of ref timing issues
            const timer = setTimeout(() => {
                if (audioRef.current) initAudio();
            }, 100);
            return () => clearTimeout(timer);
        }

        return () => {
            // Do NOT close the context here, as we are identifying it with the audio element lifetime
            // which might persist across this component's unmount/remount (e.g. strict mode or layout changes)
        };
    }, [audioRef]);

    // Handle Volume Update
    useEffect(() => {
        if (gainNodeRef.current && audioContextRef.current) {
            // Ensure context is running if we are trying to set volume
            if (audioContextRef.current.state === 'suspended' && isPlaying) {
                 audioContextRef.current.resume().catch(e => console.warn("AudioContext resume failed", e));
            }

            // Smooth transition
            const currentTime = audioContextRef.current.currentTime;
            try {
                gainNodeRef.current.gain.setValueAtTime(volume, currentTime);
            } catch {
                // Fallback
                gainNodeRef.current.gain.value = volume;
            }
        }
    }, [volume, isPlaying]);

    // Resume context on structure change or play
    useEffect(() => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended' && isPlaying) {
             audioContextRef.current.resume().catch(e => console.warn("AudioContext resume failed", e));
        }
    }, [isPlaying]);

    return null;
};

export default AudioBoostController;

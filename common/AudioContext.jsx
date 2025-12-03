import { useAudioPlayer } from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const AudioContext = createContext(null);

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};

export const AudioProvider = ({ children }) => {
    // We'll use a single player instance for background music
    // Initializing with a placeholder or empty string might not work as expected with useAudioPlayer immediately,
    // so we might need to handle the source dynamically.
    // However, expo-audio's useAudioPlayer typically takes a source.
    // Let's start with null and create it when needed, OR use a default silent track if possible,
    // but useAudioPlayer hook expects a source.
    // A better approach with the hook is to initialize it with the first track we likely need,
    // or manage the player instance differently.
    // Since we want a global singleton-like behavior, we can wrap the hook.

    // Current strategy: The hook `useAudioPlayer` creates a player.
    // We can't easily change the source of a player created by the hook without using `replace`.
    // So we will initialize it with a default (or the start screen music) and then replace it as needed.

    const START_MUSIC = 'https://musicfile.api.box/MmQyYzNlYjAtZWRjMC00OTNiLWFlNjQtNmFiZDg5NTQyMTgy.mp3';
    const player = useAudioPlayer(START_MUSIC);
    const [currentSource, setCurrentSource] = useState(START_MUSIC);
    const currentSourceRef = useRef(START_MUSIC);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (player) {
            player.loop = true;
            player.play();
        }
    }, [player]);

    const play = useCallback((source) => {
        if (!player) return;
        if (currentSourceRef.current === source) {
            player.play();
            return;
        }

        player.replace(source);
        player.loop = true;
        player.play();
        setCurrentSource(source);
        currentSourceRef.current = source;
    }, [player]);

    const pause = useCallback(() => {
        player?.pause();
    }, [player]);

    const resume = useCallback(() => {
        player?.play();
    }, [player]);

    const mute = useCallback(() => {
        if (player) {
            player.muted = true;
            setIsMuted(true);
        }
    }, [player]);

    const unmute = useCallback(() => {
        if (player) {
            player.muted = false;
            setIsMuted(false);
        }
    }, [player]);

    const toggleMute = useCallback(() => {
        if (isMuted) {
            unmute();
        } else {
            mute();
        }
    }, [isMuted, mute, unmute]);

    const value = {
        play,
        pause,
        resume,
        mute,
        unmute,
        toggleMute,
        isMuted,
        player // Expose raw player if needed, but prefer abstraction
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
};

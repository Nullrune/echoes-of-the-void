import { useEffect, useState, useCallback } from 'react';
import audioManager, { playMusic, stopMusic, playSound, stopSound } from '../utils/audio';

interface UseAudioOptions {
  autoLoadTracks?: boolean;
  tracks?: Array<{
    id: string;
    src: string;
    options?: { volume?: number; loop?: boolean };
  }>;
}

/**
 * Hook for using audio in React components
 * @param options Configuration options
 * @returns Audio control functions
 */
export const useAudio = (options: UseAudioOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);

  // Load tracks specified in options
  useEffect(() => {
    if (options.autoLoadTracks && options.tracks && options.tracks.length > 0) {
      setIsLoading(true);
      
      audioManager.preloadTracks(options.tracks)
        .then(() => {
          setIsReady(true);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load audio tracks:', error);
          setIsLoading(false);
        });
    }
  }, [options.autoLoadTracks, options.tracks]);

  // Load a single track
  const loadTrack = useCallback(async (
    id: string, 
    src: string, 
    trackOptions?: { volume?: number; loop?: boolean }
  ) => {
    try {
      await audioManager.loadTrack(id, src, trackOptions);
      return true;
    } catch (error) {
      console.error(`Failed to load track ${id}:`, error);
      return false;
    }
  }, []);

  // Play a track
  const play = useCallback((
    id: string, 
    playOptions?: { fadeIn?: number; restart?: boolean }
  ) => {
    audioManager.play(id, playOptions);
  }, []);

  // Stop a track
  const stop = useCallback((
    id: string, 
    stopOptions?: { fadeOut?: number }
  ) => {
    audioManager.stop(id, stopOptions);
  }, []);

  // Pause a track
  const pause = useCallback((id: string) => {
    audioManager.pause(id);
  }, []);

  // Resume a track
  const resume = useCallback((id: string) => {
    audioManager.resume(id);
  }, []);

  // Check if a track is playing
  const isPlaying = useCallback((id: string) => {
    return audioManager.isPlaying(id);
  }, []);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    const newMuteState = audioManager.toggleMute();
    setIsMuted(newMuteState);
    return newMuteState;
  }, []);

  // Set mute state
  const setMuted = useCallback((muted: boolean) => {
    audioManager.setMuted(muted);
    setIsMuted(muted);
  }, []);

  // Set master volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioManager.setMasterVolume(clampedVolume);
    setMasterVolume(clampedVolume);
  }, []);

  // Set track volume
  const setTrackVolume = useCallback((id: string, volume: number) => {
    audioManager.setTrackVolume(id, volume);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: Stop all playing tracks when component unmounts
      // This depends on your use case
    };
  }, []);

  return {
    isLoading,
    isReady,
    isMuted,
    masterVolume,
    loadTrack,
    play,
    stop,
    pause,
    resume,
    isPlaying,
    toggleMute,
    setMuted,
    setVolume,
    setTrackVolume,
    playMusic,
    stopMusic,
    playSound,
    stopSound,
  };
};

export default useAudio; 
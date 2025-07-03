/**
 * Audio management utility for Echoes of the Void
 * Handles background music and sound effects
 */

// Store audio instances to control them globally
interface AudioTrack {
  element: HTMLAudioElement;
  volume: number;
  isPlaying: boolean;
  loop: boolean;
}

// Audio manager singleton
class AudioManager {
  private static instance: AudioManager;
  private tracks: Map<string, AudioTrack>;
  private masterVolume: number;
  private muted: boolean;

  private constructor() {
    this.tracks = new Map();
    this.masterVolume = 0.7; // Default to 70% volume
    this.muted = false;
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Load an audio track
   * @param id Unique identifier for the track
   * @param src Path to the audio file
   * @param options Additional options (volume, loop)
   * @returns Promise that resolves when the audio is loaded
   */
  public loadTrack(
    id: string, 
    src: string, 
    options: { volume?: number; loop?: boolean } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.tracks.has(id)) {
        resolve(); // Already loaded
        return;
      }

      const audio = new Audio(src);
      audio.volume = (options.volume ?? 1) * this.masterVolume;
      audio.loop = options.loop ?? false;
      
      // Handle loading events
      audio.addEventListener('canplaythrough', () => {
        resolve();
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`Error loading audio track ${id}:`, e);
        reject(e);
      });

      // Store the track
      this.tracks.set(id, {
        element: audio,
        volume: options.volume ?? 1,
        isPlaying: false,
        loop: options.loop ?? false
      });

      // Start loading
      audio.load();
    });
  }

  /**
   * Play an audio track
   * @param id Identifier of the track to play
   * @param options Playback options
   */
  public play(
    id: string, 
    options: { fadeIn?: number; restart?: boolean } = {}
  ): void {
    const track = this.tracks.get(id);
    if (!track) {
      console.warn(`Attempted to play non-existent track: ${id}`);
      return;
    }

    const { element } = track;

    // Handle restart option
    if (options.restart || !track.isPlaying) {
      element.currentTime = 0;
    }

    // Handle fade in
    if (options.fadeIn && options.fadeIn > 0) {
      element.volume = 0;
      const originalVolume = track.volume * this.masterVolume;
      const fadeStep = originalVolume / (options.fadeIn * 10); // 10 steps per second
      
      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        currentStep++;
        element.volume = Math.min(originalVolume, currentStep * fadeStep);
        
        if (element.volume >= originalVolume) {
          clearInterval(fadeInterval);
        }
      }, 100);
    } else {
      element.volume = track.volume * this.masterVolume;
    }

    // Play the track
    element.play().catch(e => {
      console.warn(`Error playing audio ${id}:`, e);
    });
    
    track.isPlaying = true;
  }

  /**
   * Stop an audio track
   * @param id Identifier of the track to stop
   * @param options Stop options
   */
  public stop(
    id: string, 
    options: { fadeOut?: number } = {}
  ): void {
    const track = this.tracks.get(id);
    if (!track || !track.isPlaying) return;

    const { element } = track;

    // Handle fade out
    if (options.fadeOut && options.fadeOut > 0) {
      const originalVolume = element.volume;
      const fadeStep = originalVolume / (options.fadeOut * 10); // 10 steps per second
      
      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        currentStep++;
        element.volume = Math.max(0, originalVolume - (currentStep * fadeStep));
        
        if (element.volume <= 0) {
          clearInterval(fadeInterval);
          element.pause();
          element.currentTime = 0;
        }
      }, 100);
    } else {
      element.pause();
      element.currentTime = 0;
    }
    
    track.isPlaying = false;
  }

  /**
   * Pause an audio track
   * @param id Identifier of the track to pause
   */
  public pause(id: string): void {
    const track = this.tracks.get(id);
    if (!track || !track.isPlaying) return;

    track.element.pause();
    track.isPlaying = false;
  }

  /**
   * Resume a paused audio track
   * @param id Identifier of the track to resume
   */
  public resume(id: string): void {
    const track = this.tracks.get(id);
    if (!track || track.isPlaying) return;

    track.element.play().catch(e => {
      console.warn(`Error resuming audio ${id}:`, e);
    });
    track.isPlaying = true;
  }

  /**
   * Set the volume for a specific track
   * @param id Identifier of the track
   * @param volume Volume level (0-1)
   */
  public setTrackVolume(id: string, volume: number): void {
    const track = this.tracks.get(id);
    if (!track) return;

    track.volume = Math.max(0, Math.min(1, volume));
    track.element.volume = track.volume * this.masterVolume;
  }

  /**
   * Set the master volume for all tracks
   * @param volume Master volume level (0-1)
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Update all track volumes
    this.tracks.forEach(track => {
      track.element.volume = track.volume * this.masterVolume;
    });
  }

  /**
   * Mute or unmute all audio
   * @param muted Whether audio should be muted
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    
    this.tracks.forEach(track => {
      track.element.muted = muted;
    });
  }

  /**
   * Toggle mute state
   * @returns The new mute state
   */
  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Check if a track is currently playing
   * @param id Identifier of the track
   * @returns Whether the track is playing
   */
  public isPlaying(id: string): boolean {
    const track = this.tracks.get(id);
    return track ? track.isPlaying : false;
  }

  /**
   * Preload multiple audio tracks
   * @param tracks Array of track definitions
   * @returns Promise that resolves when all tracks are loaded
   */
  public preloadTracks(
    tracks: Array<{
      id: string;
      src: string;
      options?: { volume?: number; loop?: boolean };
    }>
  ): Promise<void[]> {
    const promises = tracks.map(track => 
      this.loadTrack(track.id, track.src, track.options)
    );
    return Promise.all(promises);
  }

  /**
   * Clean up and release resources
   */
  public dispose(): void {
    this.tracks.forEach(track => {
      track.element.pause();
      track.element.src = '';
    });
    this.tracks.clear();
  }
}

// Export the singleton instance
export const audioManager = AudioManager.getInstance();

// Sound effect utility functions
export const playSound = (
  id: string, 
  options: { fadeIn?: number; restart?: boolean } = {}
): void => {
  audioManager.play(id, options);
};

export const stopSound = (
  id: string, 
  options: { fadeOut?: number } = {}
): void => {
  audioManager.stop(id, options);
};

// Background music utility functions
export const playMusic = (
  id: string, 
  options: { fadeIn?: number; restart?: boolean } = { fadeIn: 2 }
): void => {
  audioManager.play(id, options);
};

export const stopMusic = (
  id: string, 
  options: { fadeOut?: number } = { fadeOut: 2 }
): void => {
  audioManager.stop(id, options);
};

export default audioManager; 
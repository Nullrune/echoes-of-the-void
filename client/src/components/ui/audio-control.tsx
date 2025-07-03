import React, { useState, useEffect } from 'react';
import useAudio from '../../hooks/useAudio';

interface AudioControlProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Audio control component with mute/unmute button
 */
const AudioControl: React.FC<AudioControlProps> = ({
  className = '',
  showLabel = false,
  size = 'md',
}) => {
  const { isMuted, toggleMute, isPlaying, playMusic } = useAudio();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  // Update audio state based on playback
  useEffect(() => {
    if (isPlaying('bg-music')) {
      setIsAudioPlaying(true);
    }
  }, [isPlaying]);
  
  // Handle click on the audio button
  const handleClick = () => {
    if (!isAudioPlaying) {
      // Start music if not playing
      playMusic('bg-music', { fadeIn: 1 });
      setIsAudioPlaying(true);
    } else {
      // Toggle mute if already playing
      toggleMute();
    }
  };
  
  // Determine size classes
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center ${className}`}
      aria-label={!isAudioPlaying || isMuted ? 'Enable audio' : 'Disable audio'}
      title={!isAudioPlaying || isMuted ? 'Enable audio' : 'Disable audio'}
    >
      <div className="relative flex items-center">
        {/* Audio icon */}
        <div className={`${sizeClasses[size]} relative`}>
          {!isAudioPlaying || isMuted ? (
            // Muted icon (X)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            // Unmuted icon (playing)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </div>
        
        {/* Optional label */}
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            {!isAudioPlaying || isMuted ? 'Enable audio' : 'Disable audio'}
          </span>
        )}
      </div>
    </button>
  );
};

export default AudioControl; 
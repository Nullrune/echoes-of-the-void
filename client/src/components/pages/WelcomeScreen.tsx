import { useAccount } from "@starknet-react/core";
import { useSpawnPlayer, useStartGame } from "../../dojo/hooks";
import { useEffect, useState, ReactNode } from "react";
import useAppStore from "../../zustand/store";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useGame } from "../../context/game-context";
import Logo from "../ui/logo";
import VoidParticles from "../ui/void-particles";
import useAudio from "../../hooks/useAudio";
import AudioControl from "../ui/audio-control";
import bgTitleScreen from "../../assets/bg-title-screen.png";
import bgMusic from "../../assets/audio/Echoes of the Cipher.mp3";

export default function WelcomeScreen() {
  const { status, handleConnect } = useStarknetConnect();
  const { address } = useAccount();
  const { initializePlayer, isInitializing, error: playerError, playerExists } = useSpawnPlayer();
  const { startGame, gameState: startGameState } = useStartGame();
  const { player } = useAppStore();
  const { state: gameState, dispatch } = useGame();
  const [startingGame, setStartingGame] = useState(false);
  const [transitionToGame, setTransitionToGame] = useState(false);
  
  // Audio setup
  const { loadTrack, playSound, stopMusic } = useAudio();

  // Ensure black background and prevent scrolling
  useEffect(() => {
    document.body.style.backgroundColor = 'black';
    document.documentElement.style.backgroundColor = 'black';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // Cleanup when component unmounts
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  
  // Load audio
  useEffect(() => {
    // Load background music
    const loadAudio = async () => {
      try {
        await loadTrack('bg-music', bgMusic, { loop: true, volume: 0.7 });
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };
    
    loadAudio();
    
    // Create button click sound using AudioContext API
    const createClickSound = async () => {
      try {
        // Get the appropriate AudioContext for the browser
        // @ts-expect-error: Safari requires webkitAudioContext
        const AudioContextClass: typeof AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        const clickBuffer = audioContext.createBuffer(1, 1000, audioContext.sampleRate);
        const channelData = clickBuffer.getChannelData(0);
        
        // Generate a soft click sound
        for (let i = 0; i < clickBuffer.length; i++) {
          // Exponential decay
          channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickBuffer.length / 8));
        }
        
        const clickBlob = await audioToBlob(clickBuffer);
        const clickUrl = URL.createObjectURL(clickBlob);
        
        // Load the generated click sound
        loadTrack('button-click', clickUrl, { volume: 0.3 });
      } catch (error) {
        console.error('Failed to create click sound:', error);
      }
    };
    
    createClickSound();
    
    // Clean up on unmount
    return () => {
      stopMusic('bg-music', { fadeOut: 1 });
    };
  }, [loadTrack, stopMusic]);
  
  // Remove the unused functions and state
  // Function to start music manually if autoplay is blocked - now handled by AudioControl
  // Add click handler to the entire screen - now handled by AudioControl
  
  // Helper function to convert AudioBuffer to Blob
  const audioToBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start(0);
      
      offlineContext.startRendering().then((renderedBuffer) => {
        const wavBlob = bufferToWave(renderedBuffer);
        resolve(wavBlob);
      });
    });
  };
  
  // Helper function to convert AudioBuffer to WAV format
  const bufferToWave = (abuffer: AudioBuffer): Blob => {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;
    
    // Write WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (depth)
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length
    
    // Write interleaved data
    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }
    
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        if (pos < length) {
          let sample = Math.max(-1, Math.min(1, channels[i][offset]));
          sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(pos, sample, true);
          pos += 2;
        }
      }
      offset++;
    }
    
    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
    
    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
    
    return new Blob([buffer], { type: "audio/wav" });
  };

  // Handle sign in and player creation
  const handleSignIn = async () => {
    // Play button click sound
    playSound('button-click');
    
    if (status !== "connected") {
      dispatch({ type: "CONNECT_WALLET_START" });
      await handleConnect();
      if (address) {
        dispatch({ type: "CONNECT_WALLET_SUCCESS", address });
      }
    } else if (!playerExists) {
      await initializePlayer();
    }
  };

  // Handle starting a new game
  const handleStartGame = async () => {
    // Play button click sound
    playSound('button-click');
    
    if (status === "connected" && player && !startGameState.isLoading && !startingGame) {
      setStartingGame(true);
      
      dispatch({
        type: "SET_TX_STATUS",
        message: "Starting game...",
        txType: "pending"
      });
      
      try {
        await startGame();
        
        if (!startGameState.error) {
          dispatch({
            type: "SET_TX_STATUS",
            message: "Game started!",
            txType: "success"
          });
          
          // This notification is used as a trigger for the game screen transition
          dispatch({
            type: "SHOW_NOTIFICATION",
            message: "Welcome to Echoes of the Void!"
          });
          
          console.log("🎮 Game start successful!");
          
          // Trigger transition to game screen
          setTransitionToGame(true);
        } else {
          throw new Error(startGameState.error);
        }
      } catch (error) {
        console.error("❌ Game start error:", error);
        dispatch({
          type: "SET_TX_STATUS",
          message: error instanceof Error ? error.message : "Failed to start game",
          txType: "error"
        });
        setStartingGame(false);
      }
    }
  };

  // Auto-initialize player when connected
  useEffect(() => {
    if (status === "connected" && !playerExists && !isInitializing) {
      initializePlayer();
    }
  }, [status, playerExists, isInitializing, initializePlayer]);
  
  // Force app refresh if transition is triggered
  useEffect(() => {
    if (transitionToGame) {
      // Force a small delay to ensure the notification is processed
      const timer = setTimeout(() => {
        // Force app state refresh by updating localStorage
        localStorage.setItem('echoes-of-the-void-game-started', 'true');
        // Reload the app to ensure clean state transition
        window.location.reload();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [transitionToGame]);

  // Show transition screen if we're moving to the game
  if (transitionToGame) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-mono text-lg">Entering the Void...</p>
        </div>
      </div>
    );
  }

  // Button component for consistent styling with void-themed design
  interface MenuButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children: ReactNode;
    isActive?: boolean;
  }
  
  const MenuButton = ({ onClick, disabled = false, children, isActive = true }: MenuButtonProps) => {
    // Pulse animation for the button border
    const [isPulsing, setIsPulsing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // Void-themed colors
    const buttonColors = {
      // Cosmic blue with slight purple tint
      normal: '#7b88e8',
      // Brighter blue-purple when hovered
      hover: '#a5b4fc',
      // Ethereal glow color
      glow: 'rgba(123, 136, 232, 0.6)',
      // Border color
      border: 'rgba(138, 154, 241, 0.4)'
    };
    
    useEffect(() => {
      if (!isActive || disabled) return;
      
      const interval = setInterval(() => {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1000);
      }, 3000);
      
      return () => clearInterval(interval);
    }, [isActive, disabled]);
    
    // Handle hover sound effect
    const handleMouseEnter = () => {
      setIsHovered(true);
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          w-full py-3 px-6 
          ${isActive 
            ? "hover:text-white" 
            : "opacity-70"
          } 
          font-bold rounded-full
          transition-all duration-300 relative overflow-hidden
          text-lg
          focus:outline-none
        `}
        style={{ 
          fontFamily: 'Bitsumishi, sans-serif',
          color: isHovered ? buttonColors.hover : buttonColors.normal,
          boxShadow: isHovered 
            ? `0 0 15px ${buttonColors.glow}, 0 0 30px rgba(29, 29, 56, 0.5)` 
            : isPulsing 
              ? `0 0 10px ${buttonColors.glow}, 0 0 20px rgba(100, 100, 255, 0.5)` 
              : `0 0 5px ${buttonColors.glow}, 0 0 10px rgba(100, 100, 255, 0.2)`,
          border: isHovered 
            ? `1px solid ${buttonColors.border}` 
            : '1px solid rgba(255, 255, 255, 0.3)',
          letterSpacing: '2px',
          textShadow: `0 0 5px ${buttonColors.glow}`,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Animated border effect */}
        <div className="absolute inset-0 pointer-events-none rounded-full">
          <div className={`absolute inset-0 opacity-50 rounded-full ${isPulsing ? 'animate-pulse' : ''}`} 
               style={{ 
                 border: isHovered 
                   ? `1px solid ${buttonColors.border}` 
                   : '1px solid rgba(255, 255, 255, 0.5)',
                 boxShadow: isHovered 
                   ? `inset 0 0 15px ${buttonColors.glow}` 
                   : 'inset 0 0 10px rgba(255, 255, 255, 0.2)',
                 transition: 'all 0.3s ease-in-out'
               }}>
          </div>
        </div>
        
        {/* Button text - integrated with the button */}
        {children}
        
        {/* Hover effect that applies to the entire button */}
        <div 
          className="absolute inset-0 rounded-full transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.2 : 0,
            background: 'linear-gradient(135deg, #1d1d38 0%, #2a2a4f 100%)'
          }}
        ></div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Background image with ancient filter effect */}
      <div 
        className="fixed inset-0 z-0 bg-black"
        style={{
          backgroundImage: `url(${bgTitleScreen})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%',
          mixBlendMode: 'normal'
        }}
      />
      
      {/* Simplified void particles effect */}
      <VoidParticles 
        count={50} 
        color="#7b88e8" 
        speed={0.2} 
        opacity={0.3} 
        size={1.2}
        className="z-5"
      />
      
      {/* Vignette overlay for better text readability and void-like effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-80 z-1"></div>
      
      {/* Audio control */}
      <div className="absolute top-4 right-4 z-20">
        <AudioControl className="text-white opacity-70 hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Main content container - using flex with auto margins to prevent overflow */}
      <div className="flex flex-col h-full w-full max-h-full z-10 relative px-4 py-4">
        {/* Content wrapper with auto scrolling if needed on very small screens */}
        <div className="flex flex-col justify-center h-full max-h-full">
          {/* Logo section with reduced height to bring content closer together */}
          <div className="flex-none flex justify-center items-center">
            <div className="w-full max-w-xl scale-125 sm:scale-150 mb-8">
              <Logo />
            </div>
          </div>
          
          {/* Button section*/}
          <div className="flex-none mt-10">
            <div className="max-w-xs sm:max-w-sm mx-auto space-y-3">
              {/* Menu buttons with conditional rendering based on state */}
              {status !== "connected" ? (
                <MenuButton onClick={handleSignIn}>
                  CONNECT CONTROLLER
                </MenuButton>
              ) : !playerExists ? (
                <MenuButton onClick={handleSignIn} disabled={isInitializing} isActive={!isInitializing}>
                  {isInitializing ? "CREATING PLAYER..." : "CREATE PLAYER"}
                </MenuButton>
              ) : (
                <MenuButton 
                  onClick={handleStartGame} 
                  disabled={startGameState.isLoading || startingGame} 
                  isActive={!startGameState.isLoading && !startingGame}
                >
                  {startGameState.isLoading || startingGame ? "STARTING GAME..." : "START GAME"}
                </MenuButton>
              )}

              {/* Error messages - more compact */}
              {playerError && (
                <div className="mt-2 text-red-400 font-mono text-xs bg-black bg-opacity-50 p-1 rounded">
                  {playerError}
                </div>
              )}
              
              {startGameState.error && (
                <div className="mt-2 text-red-400 font-mono text-xs bg-black bg-opacity-50 p-1 rounded">
                  {startGameState.error}
                </div>
              )}
              
              {gameState.txStatus.type === "error" && (
                <div className="mt-2 text-red-400 font-mono text-xs bg-black bg-opacity-50 p-1 rounded">
                  {gameState.txStatus.message}
                </div>
              )}
              
              {/* Connection status - more compact */}
              {status === "connected" && address && (
                <div className="mt-3 text-xs font-mono tracking-wider bg-black bg-opacity-30 p-1 rounded-sm" style={{ color: '#7b88e8' }}>
                  CONNECTED: {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
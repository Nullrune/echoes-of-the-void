import { useAccount } from "@starknet-react/core";
import { useSpawnPlayer, useStartGame } from "../../dojo/hooks";
import { useEffect, useState, ReactNode } from "react";
import useAppStore from "../../zustand/store";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useGame } from "../../context/game-context";
import Logo from "../ui/logo";
import VoidParticles from "../ui/void-particles";
// Import the background image
import bgTitleScreen from "../../assets/bg-title-screen.png";

export default function WelcomeScreen() {
  const { status, handleConnect } = useStarknetConnect();
  const { address } = useAccount();
  const { initializePlayer, isInitializing, error: playerError, playerExists } = useSpawnPlayer();
  const { startGame, gameState: startGameState } = useStartGame();
  const { player } = useAppStore();
  const { state: gameState, dispatch } = useGame();
  const [startingGame, setStartingGame] = useState(false);
  const [transitionToGame, setTransitionToGame] = useState(false);

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

  // Handle sign in and player creation
  const handleSignIn = async () => {
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
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
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
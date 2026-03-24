import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  {
    title: "DATA_STREAM_01.WAV",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    title: "NEURAL_LINK_02.WAV",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    title: "VOID_RESONANCE_03.WAV",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

// --- Helper Functions ---
const generateFood = (snake: { x: number; y: number }[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // Ensure food doesn't spawn on the snake
    const onSnake = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
    if (!onSnake) break;
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Use refs for state accessed inside the game loop to avoid dependency issues
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction);
  const nextDirectionRef = useRef(direction);
  const foodRef = useRef(food);
  const gameOverRef = useRef(gameOver);
  const gameStartedRef = useRef(gameStarted);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync refs
  useEffect(() => {
    snakeRef.current = snake;
    directionRef.current = direction;
    foodRef.current = food;
    gameOverRef.current = gameOver;
    gameStartedRef.current = gameStarted;
  }, [snake, direction, food, gameOver, gameStarted]);

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    nextDirectionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (!gameStartedRef.current && e.key === ' ') {
      resetGame();
      return;
    }

    if (gameOverRef.current && e.key === ' ') {
      resetGame();
      return;
    }

    const currentDir = directionRef.current;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (currentDir.y !== 1) nextDirectionRef.current = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (currentDir.y !== -1) nextDirectionRef.current = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (currentDir.x !== 1) nextDirectionRef.current = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (currentDir.x !== -1) nextDirectionRef.current = { x: 1, y: 0 };
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      const currentSnake = [...snakeRef.current];
      const head = { ...currentSnake[0] };
      const currentDir = nextDirectionRef.current;
      
      setDirection(currentDir); // Update actual state for next frame's reference

      head.x += currentDir.x;
      head.y += currentDir.y;

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return;
      }

      // Check self collision
      if (currentSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return;
      }

      currentSnake.unshift(head);

      // Check food collision
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore((s) => {
          const newScore = s + 10;
          setHighScore((hs) => Math.max(hs, newScore));
          return newScore;
        });
        setFood(generateFood(currentSnake));
      } else {
        currentSnake.pop();
      }

      setSnake(currentSnake);
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#0ff] flex flex-col items-center justify-center font-mono overflow-hidden relative crt-flicker selection:bg-[#f0f] selection:text-black">
      {/* Overlays */}
      <div className="bg-static" />
      <div className="scanlines" />

      <div className="screen-tear z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Header */}
        <header className="mb-6 text-center w-full border-b-4 border-[#f0f] pb-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 glitch-text" data-text="SYS.OVERRIDE // SNAKE.EXE">
            SYS.OVERRIDE // SNAKE.EXE
          </h1>
          <div className="flex justify-between px-8 text-xl bg-[#f0f] text-black py-1 mt-4 font-bold">
            <p>CYCLES: {score}</p>
            <p>MAX_CYCLES: {highScore}</p>
          </div>
        </header>

        {/* Game Board */}
        <div className="relative p-2 bg-[#050505] border-4 border-[#0ff] shadow-[8px_8px_0px_#f0f]">
          <div 
            className="bg-black relative overflow-hidden"
            style={{
              width: `${GRID_SIZE * 20}px`,
              height: `${GRID_SIZE * 20}px`,
            }}
          >
            {/* Grid Lines (Harsh) */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #0ff 1px, transparent 1px), linear-gradient(to bottom, #0ff 1px, transparent 1px)`,
                backgroundSize: `20px 20px`
              }}
            />

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`absolute transition-none ${
                    isHead 
                      ? 'bg-[#fff] border-2 border-[#0ff] z-10' 
                      : 'bg-[#0ff]'
                  }`}
                  style={{
                    left: `${segment.x * 20}px`,
                    top: `${segment.y * 20}px`,
                    width: '20px',
                    height: '20px',
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute bg-[#f0f] animate-pulse"
              style={{
                left: `${food.x * 20}px`,
                top: `${food.y * 20}px`,
                width: '20px',
                height: '20px',
              }}
            />

            {/* Overlays */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-[#0ff] text-black font-bold text-2xl hover:bg-[#f0f] hover:text-white transition-none border-4 border-transparent hover:border-[#0ff] cursor-pointer"
                >
                  [ INITIATE_SEQUENCE ]
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-[#f0f]/90 flex flex-col items-center justify-center text-black">
                <h2 className="text-5xl font-bold mb-2 glitch-text" data-text="FATAL_ERROR">FATAL_ERROR</h2>
                <p className="text-2xl mb-8 font-bold">TERMINATED AT CYCLE {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-black text-[#0ff] font-bold text-2xl hover:bg-[#0ff] hover:text-black transition-none border-4 border-black cursor-pointer"
                >
                  [ REBOOT_SYSTEM ]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Music Player */}
        <div className="mt-8 w-full border-4 border-[#f0f] bg-[#050505] p-4 shadow-[-8px_8px_0px_#0ff]">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end border-b-2 border-[#0ff] pb-2">
              <p className="text-sm text-[#f0f] font-bold">AUDIO_STREAM_ACTIVE</p>
              <p className={`text-2xl font-bold ${isPlaying ? 'animate-pulse text-[#0ff]' : 'text-gray-500'}`}>
                {TRACKS[currentTrackIndex].title}
              </p>
            </div>
            
            <audio
              ref={audioRef}
              src={TRACKS[currentTrackIndex].url}
              onEnded={handleTrackEnd}
              muted={isMuted}
              loop={false}
            />

            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-4 text-xl font-bold">
                <button 
                  onClick={prevTrack}
                  className="hover:text-[#f0f] hover:bg-[#0ff] px-2 cursor-pointer transition-none"
                >
                  [ &lt;&lt; ]
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="hover:text-black hover:bg-[#f0f] px-4 text-[#0ff] bg-black border-2 border-[#0ff] cursor-pointer transition-none"
                >
                  {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
                </button>
                
                <button 
                  onClick={nextTrack}
                  className="hover:text-[#f0f] hover:bg-[#0ff] px-2 cursor-pointer transition-none"
                >
                  [ &gt;&gt; ]
                </button>
              </div>

              <button 
                onClick={toggleMute}
                className="hover:text-[#f0f] hover:bg-[#0ff] px-2 text-xl font-bold cursor-pointer transition-none"
              >
                {isMuted ? '[ VOL: 0% ]' : '[ VOL: 100% ]'}
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="h-4 w-full border-2 border-[#0ff] mt-4 relative overflow-hidden bg-black">
              <div 
                className="h-full bg-[#f0f]"
                style={{ 
                  width: isPlaying ? '100%' : '0%',
                  animation: isPlaying ? `progress ${audioRef.current?.duration || 200}s linear infinite` : 'none' 
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

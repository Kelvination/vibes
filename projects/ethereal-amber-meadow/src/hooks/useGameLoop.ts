import { useEffect, useRef, useCallback, useState } from 'react';

export interface UseGameLoopOptions {
  onUpdate: (deltaTime: number) => void; // Called every frame with delta time in seconds
  targetFPS?: number; // Target frames per second (default: 60)
  paused?: boolean; // External pause control
  pauseOnBlur?: boolean; // Pause when window loses focus (default: true)
}

export interface UseGameLoopReturn {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isRunning: boolean;
  isPaused: boolean;
  fps: number; // Actual FPS
}

export function useGameLoop(options: UseGameLoopOptions): UseGameLoopReturn {
  const {
    onUpdate,
    targetFPS = 60,
    paused = false,
    pauseOnBlur = true,
  } = options;

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(paused);
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsUpdateTimeRef = useRef<number>(0);

  // Keep refs in sync with state for synchronous access in RAF callback
  const isRunningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(paused);

  // Calculate actual FPS
  const updateFPS = useCallback((currentTime: number) => {
    frameCountRef.current++;

    if (currentTime - fpsUpdateTimeRef.current >= 1000) {
      // Update FPS every second
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      fpsUpdateTimeRef.current = currentTime;
    }
  }, []);

  // Main loop function
  const loop = useCallback((currentTime: number) => {
    if (!isRunningRef.current || isPausedRef.current) {
      lastTimeRef.current = currentTime;
      return;
    }

    // Calculate delta time
    const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = currentTime;

    // Call update callback with delta time
    if (deltaTime > 0) {
      // Clamp delta time to prevent huge jumps (max 5 frames worth)
      const clampedDelta = Math.min(deltaTime, (1 / targetFPS) * 5);
      onUpdate(clampedDelta);
    }

    // Update FPS counter
    updateFPS(currentTime);

    // Request next frame
    rafIdRef.current = requestAnimationFrame(loop);
  }, [onUpdate, targetFPS, updateFPS]);

  // Start the game loop
  const start = useCallback(() => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    isPausedRef.current = false;
    setIsRunning(true);
    setIsPaused(false);
    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // Stop the game loop
  const stop = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    setIsRunning(false);
    setIsPaused(false);

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Pause the game loop
  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
  }, []);

  // Resume the game loop
  const resume = useCallback(() => {
    if (!isRunningRef.current) return;

    isPausedRef.current = false;
    setIsPaused(false);
    lastTimeRef.current = performance.now(); // Reset time to prevent large delta
    rafIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // Handle visibility change (pause when tab inactive)
  useEffect(() => {
    if (!pauseOnBlur) return;

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        if (isRunningRef.current && !isPausedRef.current) {
          pause();
        }
      } else {
        if (isRunningRef.current && isPausedRef.current) {
          resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseOnBlur, pause, resume]);

  // Sync external pause state
  useEffect(() => {
    if (paused && !isPausedRef.current) {
      isPausedRef.current = true;
      setIsPaused(true);
    } else if (!paused && isPausedRef.current && isRunningRef.current) {
      isPausedRef.current = false;
      setIsPaused(false);
      lastTimeRef.current = performance.now();
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(loop);
      }
    }
  }, [paused, loop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    pause,
    resume,
    isRunning,
    isPaused,
    fps,
  };
}

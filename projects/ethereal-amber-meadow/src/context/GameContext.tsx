import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { GameState, GameAction } from '../types';
import { gameReducer } from './gameReducer';
import { INITIAL_GAME_STATE } from '../utils/constants';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience methods
  startGame: (level: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  winGame: (score: number, time: number, stars: number) => void;
  loseGame: () => void;
  resetGame: () => void;
  updateTime: (delta: number) => void;
  collectStar: (starId: string) => void;
  updateScore: (points: number) => void;
  nextLevel: () => void;
  loadLevel: (level: number) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);

  // Memoized action creators
  const startGame = useCallback((level: number) => {
    dispatch({ type: 'START_GAME', level });
  }, []);

  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' });
  }, []);

  const resumeGame = useCallback(() => {
    dispatch({ type: 'RESUME_GAME' });
  }, []);

  const winGame = useCallback((score: number, time: number, stars: number) => {
    dispatch({ type: 'WIN_GAME', score, time, stars });
  }, []);

  const loseGame = useCallback(() => {
    dispatch({ type: 'LOSE_GAME' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const updateTime = useCallback((delta: number) => {
    dispatch({ type: 'UPDATE_TIME', delta });
  }, []);

  const collectStar = useCallback((starId: string) => {
    dispatch({ type: 'COLLECT_STAR', starId });
  }, []);

  const updateScore = useCallback((points: number) => {
    dispatch({ type: 'UPDATE_SCORE', points });
  }, []);

  const nextLevel = useCallback(() => {
    dispatch({ type: 'NEXT_LEVEL' });
  }, []);

  const loadLevel = useCallback((level: number) => {
    dispatch({ type: 'LOAD_LEVEL', level });
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    startGame,
    pauseGame,
    resumeGame,
    winGame,
    loseGame,
    resetGame,
    updateTime,
    collectStar,
    updateScore,
    nextLevel,
    loadLevel,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function useGameState(): GameState {
  const { state } = useGame();
  return state;
}

export function useGameActions() {
  const {
    startGame,
    pauseGame,
    resumeGame,
    winGame,
    loseGame,
    resetGame,
    updateTime,
    collectStar,
    updateScore,
    nextLevel,
    loadLevel,
  } = useGame();

  return {
    startGame,
    pauseGame,
    resumeGame,
    winGame,
    loseGame,
    resetGame,
    updateTime,
    collectStar,
    updateScore,
    nextLevel,
    loadLevel,
  };
}

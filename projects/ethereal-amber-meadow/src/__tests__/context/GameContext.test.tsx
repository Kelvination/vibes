import { describe, it, expect } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { GameProvider, useGame, useGameState, useGameActions } from '../../context/GameContext';

describe('GameContext', () => {
  describe('GameProvider', () => {
    it('should render children', () => {
      const { getByText } = render(
        <GameProvider>
          <div>Test Child</div>
        </GameProvider>
      );
      expect(getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('useGame hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useGame());
      }).toThrow('useGame must be used within a GameProvider');
    });

    it('should provide game state and actions', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: GameProvider,
      });

      expect(result.current.state).toBeDefined();
      expect(result.current.dispatch).toBeDefined();
      expect(result.current.startGame).toBeDefined();
      expect(result.current.pauseGame).toBeDefined();
    });
  });

  describe('useGameState hook', () => {
    it('should return current state', () => {
      const { result } = renderHook(() => useGameState(), {
        wrapper: GameProvider,
      });

      expect(result.current.status).toBe('menu');
      expect(result.current.score).toBe(0);
    });
  });

  describe('useGameActions hook', () => {
    it('should provide action methods', () => {
      const { result } = renderHook(() => useGameActions(), {
        wrapper: GameProvider,
      });

      expect(result.current.startGame).toBeDefined();
      expect(result.current.pauseGame).toBeDefined();
      expect(result.current.winGame).toBeDefined();
    });
  });

  describe('game actions', () => {
    it('should start game', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: GameProvider,
      });

      act(() => {
        result.current.startGame(1);
      });

      expect(result.current.state.status).toBe('playing');
      expect(result.current.state.currentLevel).toBe(1);
    });

    it('should pause and resume game', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: GameProvider,
      });

      act(() => {
        result.current.startGame(1);
      });
      expect(result.current.state.status).toBe('playing');

      act(() => {
        result.current.pauseGame();
      });
      expect(result.current.state.status).toBe('paused');

      act(() => {
        result.current.resumeGame();
      });
      expect(result.current.state.status).toBe('playing');
    });

    it('should collect stars', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: GameProvider,
      });

      act(() => {
        result.current.collectStar('star-1');
        result.current.collectStar('star-2');
      });

      expect(result.current.state.starsCollected).toBe(2);
    });

    it('should update score', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: GameProvider,
      });

      act(() => {
        result.current.updateScore(100);
        result.current.updateScore(50);
      });

      expect(result.current.state.score).toBe(150);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { gameReducer } from '../../context/gameReducer';
import { GameState } from '../../types';
import { INITIAL_GAME_STATE } from '../../utils/constants';

describe('gameReducer', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = { ...INITIAL_GAME_STATE };
  });

  describe('START_GAME', () => {
    it('should start game with specified level', () => {
      const result = gameReducer(initialState, { type: 'START_GAME', level: 2 });
      expect(result.status).toBe('playing');
      expect(result.currentLevel).toBe(2);
      expect(result.score).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });

    it('should reset score and time when starting', () => {
      const stateWithProgress = {
        ...initialState,
        score: 1000,
        timeElapsed: 60,
      };
      const result = gameReducer(stateWithProgress, { type: 'START_GAME', level: 1 });
      expect(result.score).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });
  });

  describe('PAUSE_GAME', () => {
    it('should set status to paused', () => {
      const playingState = { ...initialState, status: 'playing' as const };
      const result = gameReducer(playingState, { type: 'PAUSE_GAME' });
      expect(result.status).toBe('paused');
    });

    it('should preserve other state when pausing', () => {
      const playingState = {
        ...initialState,
        status: 'playing' as const,
        score: 500,
        timeElapsed: 30,
      };
      const result = gameReducer(playingState, { type: 'PAUSE_GAME' });
      expect(result.score).toBe(500);
      expect(result.timeElapsed).toBe(30);
    });
  });

  describe('RESUME_GAME', () => {
    it('should set status to playing', () => {
      const pausedState = { ...initialState, status: 'paused' as const };
      const result = gameReducer(pausedState, { type: 'RESUME_GAME' });
      expect(result.status).toBe('playing');
    });
  });

  describe('WIN_GAME', () => {
    it('should set status to won and update stats', () => {
      const playingState = {
        ...initialState,
        status: 'playing' as const,
        score: 500,
      };
      const result = gameReducer(playingState, {
        type: 'WIN_GAME',
        score: 300,
        time: 45,
        stars: 3,
      });
      expect(result.status).toBe('won');
      expect(result.score).toBe(800); // 500 + 300
      expect(result.timeElapsed).toBe(45);
      expect(result.starsCollected).toBe(3);
    });
  });

  describe('LOSE_GAME', () => {
    it('should set status to lost', () => {
      const playingState = { ...initialState, status: 'playing' as const };
      const result = gameReducer(playingState, { type: 'LOSE_GAME' });
      expect(result.status).toBe('lost');
    });
  });

  describe('RESET_GAME', () => {
    it('should reset to initial state', () => {
      const progressState = {
        ...initialState,
        status: 'won' as const,
        score: 1000,
        currentLevel: 5,
        timeElapsed: 120,
      };
      const result = gameReducer(progressState, { type: 'RESET_GAME' });
      expect(result).toEqual(INITIAL_GAME_STATE);
    });
  });

  describe('UPDATE_TIME', () => {
    it('should increment time elapsed', () => {
      const result = gameReducer(initialState, { type: 'UPDATE_TIME', delta: 1 });
      expect(result.timeElapsed).toBe(1);
    });

    it('should accumulate time correctly', () => {
      let state = initialState;
      state = gameReducer(state, { type: 'UPDATE_TIME', delta: 0.5 });
      state = gameReducer(state, { type: 'UPDATE_TIME', delta: 0.3 });
      state = gameReducer(state, { type: 'UPDATE_TIME', delta: 0.2 });
      expect(state.timeElapsed).toBeCloseTo(1.0);
    });
  });

  describe('COLLECT_STAR', () => {
    it('should increment stars collected', () => {
      const result = gameReducer(initialState, { type: 'COLLECT_STAR', starId: 'star-1' });
      expect(result.starsCollected).toBe(1);
    });

    it('should accumulate multiple stars', () => {
      let state = initialState;
      state = gameReducer(state, { type: 'COLLECT_STAR', starId: 'star-1' });
      state = gameReducer(state, { type: 'COLLECT_STAR', starId: 'star-2' });
      state = gameReducer(state, { type: 'COLLECT_STAR', starId: 'star-3' });
      expect(state.starsCollected).toBe(3);
    });
  });

  describe('UPDATE_SCORE', () => {
    it('should add points to score', () => {
      const result = gameReducer(initialState, { type: 'UPDATE_SCORE', points: 100 });
      expect(result.score).toBe(100);
    });

    it('should accumulate score correctly', () => {
      let state = initialState;
      state = gameReducer(state, { type: 'UPDATE_SCORE', points: 100 });
      state = gameReducer(state, { type: 'UPDATE_SCORE', points: 50 });
      state = gameReducer(state, { type: 'UPDATE_SCORE', points: 200 });
      expect(state.score).toBe(350);
    });
  });

  describe('NEXT_LEVEL', () => {
    it('should increment level and reset progress', () => {
      const completedState = {
        ...initialState,
        currentLevel: 2,
        status: 'won' as const,
        starsCollected: 3,
        timeElapsed: 45,
      };
      const result = gameReducer(completedState, { type: 'NEXT_LEVEL' });
      expect(result.currentLevel).toBe(3);
      expect(result.status).toBe('menu');
      expect(result.starsCollected).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });
  });

  describe('LOAD_LEVEL', () => {
    it('should load specified level', () => {
      const result = gameReducer(initialState, { type: 'LOAD_LEVEL', level: 5 });
      expect(result.currentLevel).toBe(5);
      expect(result.status).toBe('menu');
    });

    it('should reset level progress', () => {
      const progressState = {
        ...initialState,
        starsCollected: 2,
        timeElapsed: 30,
      };
      const result = gameReducer(progressState, { type: 'LOAD_LEVEL', level: 1 });
      expect(result.starsCollected).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState };
      gameReducer(originalState, { type: 'UPDATE_SCORE', points: 100 });
      expect(originalState).toEqual(initialState);
    });
  });
});

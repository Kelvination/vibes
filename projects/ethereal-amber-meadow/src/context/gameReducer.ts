import { GameState, GameAction } from '../types';
import { INITIAL_GAME_STATE } from '../utils/constants';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...INITIAL_GAME_STATE,
        status: 'playing',
        currentLevel: action.level,
      };

    case 'PAUSE_GAME':
      return {
        ...state,
        status: 'paused',
      };

    case 'RESUME_GAME':
      return {
        ...state,
        status: 'playing',
      };

    case 'WIN_GAME':
      return {
        ...state,
        status: 'won',
        score: state.score + action.score,
        timeElapsed: action.time,
        starsCollected: action.stars,
      };

    case 'LOSE_GAME':
      return {
        ...state,
        status: 'lost',
      };

    case 'RESET_GAME':
      return INITIAL_GAME_STATE;

    case 'UPDATE_TIME':
      return {
        ...state,
        timeElapsed: state.timeElapsed + action.delta,
      };

    case 'COLLECT_STAR':
      return {
        ...state,
        starsCollected: state.starsCollected + 1,
      };

    case 'UPDATE_SCORE':
      return {
        ...state,
        score: state.score + action.points,
      };

    case 'NEXT_LEVEL':
      return {
        ...state,
        currentLevel: state.currentLevel + 1,
        status: 'menu',
        starsCollected: 0,
        timeElapsed: 0,
      };

    case 'LOAD_LEVEL':
      return {
        ...state,
        currentLevel: action.level,
        status: 'menu',
        starsCollected: 0,
        timeElapsed: 0,
      };

    default:
      return state;
  }
}

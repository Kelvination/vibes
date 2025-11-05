/**
 * Core type definitions for the Bounce & Collect game
 */

/**
 * 2D vector for positions, velocities, and forces
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Game status states
 */
export type GameStatus = 'menu' | 'playing' | 'paused' | 'won' | 'lost';

/**
 * Complete game state
 */
export interface GameState {
  status: GameStatus;
  currentLevel: number;
  score: number;
  timeElapsed: number;
  starsCollected: number;
  totalStars: number;
  lives: number;
}

/**
 * Level star rating (1-3 stars)
 */
export type StarRating = 1 | 2 | 3;

/**
 * Progress for a single level
 */
export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: StarRating;
  bestTime: number;
  bestScore: number;
}

/**
 * Obstacle types
 */
export type ObstacleType = 'rectangle' | 'circle' | 'triangle';

/**
 * Obstacle configuration in a level
 */
export interface ObstacleConfig {
  type: ObstacleType;
  position: Vector2D;
  width?: number; // For rectangles
  height?: number; // For rectangles
  radius?: number; // For circles
  angle?: number; // Rotation in radians
  isStatic: boolean;
}

/**
 * Star (collectible) configuration
 */
export interface StarConfig {
  id: string;
  position: Vector2D;
  radius: number;
}

/**
 * Goal/target configuration
 */
export interface GoalConfig {
  position: Vector2D;
  radius: number;
}

/**
 * Ball (player) configuration
 */
export interface BallConfig {
  position: Vector2D;
  radius: number;
  mass: number;
}

/**
 * Complete level definition
 */
export interface Level {
  id: number;
  name: string;
  description: string;
  ball: BallConfig;
  goal: GoalConfig;
  obstacles: ObstacleConfig[];
  stars: StarConfig[];
  gravity: Vector2D;
  timeLimit: number; // Seconds
  par: {
    time: number; // Par time for 3 stars
    stars: number; // Required stars for 3 stars
  };
}

/**
 * Collision event data
 */
export interface CollisionEvent {
  bodyA: string; // Body label
  bodyB: string; // Body label
  timestamp: number;
}

/**
 * Touch/pointer event data
 */
export interface TouchEvent {
  position: Vector2D;
  type: 'start' | 'move' | 'end';
  timestamp: number;
}

/**
 * Gesture types recognized by the game
 */
export type GestureType = 'tap' | 'longPress' | 'swipe' | 'none';

/**
 * Gesture event data
 */
export interface GestureEvent {
  type: GestureType;
  position: Vector2D;
  delta?: Vector2D; // For swipes
  duration?: number; // For long press
}

/**
 * Physics configuration
 */
export interface PhysicsConfig {
  gravity: Vector2D;
  timeScale: number;
  enableSleeping: boolean;
  friction: number;
  restitution: number; // Bounciness
}

/**
 * Entity types in the game world
 */
export type EntityType = 'ball' | 'obstacle' | 'star' | 'goal' | 'boundary';

/**
 * Base entity interface
 */
export interface Entity {
  id: string;
  type: EntityType;
  position: Vector2D;
  angle: number;
  velocity?: Vector2D;
  isStatic: boolean;
}

/**
 * Game action types for reducer
 */
export type GameAction =
  | { type: 'START_GAME'; level: number }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'WIN_GAME'; score: number; time: number; stars: number }
  | { type: 'LOSE_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_TIME'; delta: number }
  | { type: 'COLLECT_STAR'; starId: string }
  | { type: 'UPDATE_SCORE'; points: number }
  | { type: 'NEXT_LEVEL' }
  | { type: 'LOAD_LEVEL'; level: number };

/**
 * Saved game data structure
 */
export interface SavedGameData {
  version: string;
  levelProgress: Record<number, LevelProgress>;
  currentLevel: number;
  totalScore: number;
  lastPlayed: string; // ISO date string
}

/**
 * Game constants and configuration values
 */

import type { Vector2D } from '../types';

/**
 * Canvas and viewport settings
 */
export const CANVAS = {
  WIDTH: 800,
  HEIGHT: 600,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 480,
  ASPECT_RATIO: 4 / 3,
  BACKGROUND_COLOR: '#1a1a2e',
} as const;

/**
 * Physics constants
 */
export const PHYSICS = {
  GRAVITY: { x: 0, y: 1 } as Vector2D,
  TIME_SCALE: 1,
  ENABLE_SLEEPING: false,
  DEFAULT_FRICTION: 0.1,
  DEFAULT_RESTITUTION: 0.8, // Bounciness
  DEFAULT_DENSITY: 0.001,
  AIR_FRICTION: 0.01,
  FPS: 60,
  DELTA_TIME: 1000 / 60, // ~16.67ms
} as const;

/**
 * Ball (player) settings
 */
export const BALL = {
  RADIUS: 20,
  MASS: 1,
  COLOR: '#ff6b6b',
  OUTLINE_COLOR: '#c92a2a',
  OUTLINE_WIDTH: 2,
  MAX_VELOCITY: 20,
} as const;

/**
 * Obstacle settings
 */
export const OBSTACLE = {
  COLOR: '#4a5568',
  OUTLINE_COLOR: '#2d3748',
  OUTLINE_WIDTH: 2,
  MIN_SIZE: 20,
  MAX_SIZE: 200,
} as const;

/**
 * Star (collectible) settings
 */
export const STAR = {
  RADIUS: 15,
  COLOR: '#ffd93d',
  GLOW_COLOR: '#f39c12',
  POINTS: 100,
  ANIMATION_SPEED: 2, // Rotation speed
} as const;

/**
 * Goal settings
 */
export const GOAL = {
  RADIUS: 30,
  COLOR: '#6bcf7f',
  GLOW_COLOR: '#2ecc71',
  ANIMATION_SPEED: 1,
} as const;

/**
 * Boundary settings (walls)
 */
export const BOUNDARY = {
  THICKNESS: 20,
  COLOR: '#2c3e50',
  POSITION_OFFSET: 10, // Pixels outside canvas
} as const;

/**
 * Touch and input settings
 */
export const INPUT = {
  TAP_MAX_DURATION: 200, // ms
  LONG_PRESS_DURATION: 500, // ms
  SWIPE_MIN_DISTANCE: 30, // pixels
  SWIPE_MAX_DURATION: 300, // ms
  TOUCH_RADIUS: 44, // Minimum touch target (Apple HIG)
  DOUBLE_TAP_DELAY: 300, // ms
} as const;

/**
 * Game timing
 */
export const TIMING = {
  DEFAULT_TIME_LIMIT: 60, // seconds
  WIN_DELAY: 1000, // ms before showing win screen
  LOSE_DELAY: 1000, // ms before showing lose screen
  COUNTDOWN_START: 3, // seconds
  LEVEL_TRANSITION_DELAY: 500, // ms
} as const;

/**
 * Scoring system
 */
export const SCORING = {
  BASE_POINTS: 1000,
  STAR_POINTS: 100,
  TIME_BONUS_MULTIPLIER: 10, // points per second remaining
  PERFECT_BONUS: 500, // All stars collected
  THREE_STAR_THRESHOLD: 0.8, // 80% of max possible score
  TWO_STAR_THRESHOLD: 0.5, // 50% of max possible score
} as const;

/**
 * UI colors
 */
export const COLORS = {
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.7)',
  BACKGROUND: '#1a1a2e',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BACKGROUND: 0,
  GAME_CANVAS: 1,
  UI_OVERLAY: 10,
  HUD: 20,
  MENU: 30,
  MODAL: 40,
  TOAST: 50,
} as const;

/**
 * Animation durations
 */
export const ANIMATION = {
  FADE_IN: 300,
  FADE_OUT: 200,
  SLIDE_IN: 400,
  SLIDE_OUT: 300,
  BOUNCE: 600,
  SCALE: 200,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  GAME_DATA: 'bounce-collect-game-data',
  SETTINGS: 'bounce-collect-settings',
  HIGH_SCORES: 'bounce-collect-high-scores',
} as const;

/**
 * Game version
 */
export const VERSION = '0.1.0' as const;

/**
 * Debug settings
 */
export const DEBUG = {
  ENABLED: import.meta.env.DEV,
  SHOW_FPS: false,
  SHOW_PHYSICS_DEBUG: false,
  LOG_COLLISIONS: false,
  LOG_GESTURES: false,
} as const;

/**
 * Performance settings
 */
export const PERFORMANCE = {
  MAX_PARTICLES: 100,
  PARTICLE_LIFETIME: 1000, // ms
  ENABLE_SHADOWS: true,
  ENABLE_GLOW: true,
  PIXEL_RATIO: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2 for performance
} as const;

/**
 * Initial game state
 */
export const INITIAL_GAME_STATE = {
  status: 'menu' as const,
  currentLevel: 1,
  score: 0,
  timeElapsed: 0,
  starsCollected: 0,
  totalStars: 0,
  lives: 3,
} as const;

/**
 * Mobile detection
 */
export const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/**
 * Touch support detection
 */
export const HAS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/**
 * Calculate responsive canvas size based on viewport
 */
export function getCanvasSize(): { width: number; height: number } {
  const width = Math.min(window.innerWidth, CANVAS.WIDTH);
  const height = Math.min(window.innerHeight, CANVAS.HEIGHT);

  // Maintain aspect ratio
  const targetRatio = CANVAS.ASPECT_RATIO;
  const currentRatio = width / height;

  if (currentRatio > targetRatio) {
    // Too wide, constrain by height
    return {
      width: height * targetRatio,
      height,
    };
  } else {
    // Too tall, constrain by width
    return {
      width,
      height: width / targetRatio,
    };
  }
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * Degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

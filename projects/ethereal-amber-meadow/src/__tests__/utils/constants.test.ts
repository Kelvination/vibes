import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  distance,
  normalize,
  degToRad,
  radToDeg,
  getCanvasSize,
  CANVAS,
  PHYSICS,
  BALL,
  STAR,
} from '../../utils/constants';

describe('Utility Functions', () => {
  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should clamp to min when value is below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, 0, 10)).toBe(0);
    });

    it('should clamp to max when value is above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, 0, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, 0)).toBe(-5);
      expect(clamp(-15, -10, 0)).toBe(-10);
      expect(clamp(5, -10, 0)).toBe(0);
    });
  });

  describe('lerp', () => {
    it('should interpolate between two values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 100, 0.25)).toBe(25);
      expect(lerp(0, 100, 0.75)).toBe(75);
    });

    it('should return start when t is 0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('should return end when t is 1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
      expect(lerp(-100, 0, 0.5)).toBe(-50);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
      expect(distance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5);
    });

    it('should handle negative coordinates', () => {
      expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
      expect(distance({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
    });

    it('should be commutative', () => {
      const p1 = { x: 10, y: 20 };
      const p2 = { x: 30, y: 40 };
      expect(distance(p1, p2)).toBe(distance(p2, p1));
    });
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const result = normalize({ x: 3, y: 4 });
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);

      // Check magnitude is 1
      const magnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(magnitude).toBeCloseTo(1);
    });

    it('should handle zero vector', () => {
      const result = normalize({ x: 0, y: 0 });
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle unit vectors', () => {
      const result1 = normalize({ x: 1, y: 0 });
      expect(result1.x).toBeCloseTo(1);
      expect(result1.y).toBeCloseTo(0);

      const result2 = normalize({ x: 0, y: 1 });
      expect(result2.x).toBeCloseTo(0);
      expect(result2.y).toBeCloseTo(1);
    });

    it('should handle negative values', () => {
      const result = normalize({ x: -3, y: -4 });
      expect(result.x).toBeCloseTo(-0.6);
      expect(result.y).toBeCloseTo(-0.8);
    });
  });

  describe('degToRad', () => {
    it('should convert degrees to radians', () => {
      expect(degToRad(0)).toBe(0);
      expect(degToRad(180)).toBeCloseTo(Math.PI);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    it('should handle negative degrees', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
      expect(degToRad(-180)).toBeCloseTo(-Math.PI);
    });
  });

  describe('radToDeg', () => {
    it('should convert radians to degrees', () => {
      expect(radToDeg(0)).toBe(0);
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });

    it('should handle negative radians', () => {
      expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90);
      expect(radToDeg(-Math.PI)).toBeCloseTo(-180);
    });

    it('should be inverse of degToRad', () => {
      const degrees = 45;
      expect(radToDeg(degToRad(degrees))).toBeCloseTo(degrees);
    });
  });

  describe('getCanvasSize', () => {
    it('should return valid canvas dimensions', () => {
      const size = getCanvasSize();
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    });

    it('should maintain aspect ratio', () => {
      const size = getCanvasSize();
      const ratio = size.width / size.height;
      expect(ratio).toBeCloseTo(CANVAS.ASPECT_RATIO, 1);
    });

    it('should not exceed max dimensions', () => {
      const size = getCanvasSize();
      expect(size.width).toBeLessThanOrEqual(CANVAS.WIDTH);
      expect(size.height).toBeLessThanOrEqual(CANVAS.HEIGHT);
    });
  });
});

describe('Constants', () => {
  describe('CANVAS', () => {
    it('should have valid dimensions', () => {
      expect(CANVAS.WIDTH).toBeGreaterThan(0);
      expect(CANVAS.HEIGHT).toBeGreaterThan(0);
      expect(CANVAS.MIN_WIDTH).toBeGreaterThan(0);
      expect(CANVAS.MIN_HEIGHT).toBeGreaterThan(0);
    });

    it('should have valid aspect ratio', () => {
      expect(CANVAS.ASPECT_RATIO).toBeGreaterThan(0);
      expect(CANVAS.ASPECT_RATIO).toBeCloseTo(4 / 3);
    });
  });

  describe('PHYSICS', () => {
    it('should have valid gravity vector', () => {
      expect(PHYSICS.GRAVITY.x).toBeDefined();
      expect(PHYSICS.GRAVITY.y).toBeDefined();
      expect(typeof PHYSICS.GRAVITY.x).toBe('number');
      expect(typeof PHYSICS.GRAVITY.y).toBe('number');
    });

    it('should have valid time scale', () => {
      expect(PHYSICS.TIME_SCALE).toBeGreaterThan(0);
      expect(PHYSICS.TIME_SCALE).toBeLessThanOrEqual(2);
    });

    it('should have valid friction and restitution', () => {
      expect(PHYSICS.DEFAULT_FRICTION).toBeGreaterThanOrEqual(0);
      expect(PHYSICS.DEFAULT_FRICTION).toBeLessThanOrEqual(1);
      expect(PHYSICS.DEFAULT_RESTITUTION).toBeGreaterThanOrEqual(0);
      expect(PHYSICS.DEFAULT_RESTITUTION).toBeLessThanOrEqual(1);
    });

    it('should target 60 FPS', () => {
      expect(PHYSICS.FPS).toBe(60);
      expect(PHYSICS.DELTA_TIME).toBeCloseTo(1000 / 60, 1);
    });
  });

  describe('BALL', () => {
    it('should have valid dimensions', () => {
      expect(BALL.RADIUS).toBeGreaterThan(0);
      expect(BALL.MASS).toBeGreaterThan(0);
    });

    it('should have valid colors', () => {
      expect(BALL.COLOR).toMatch(/^#[0-9a-f]{6}$/i);
      expect(BALL.OUTLINE_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('STAR', () => {
    it('should have valid dimensions', () => {
      expect(STAR.RADIUS).toBeGreaterThan(0);
    });

    it('should have positive point value', () => {
      expect(STAR.POINTS).toBeGreaterThan(0);
    });
  });
});

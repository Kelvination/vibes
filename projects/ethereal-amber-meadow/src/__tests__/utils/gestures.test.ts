import { describe, it, expect } from 'vitest';
import {
  detectGesture,
  getSwipeDirection,
  normalizeCoordinates,
  TouchPoint,
} from '../../utils/gestures';
import { INPUT } from '../../utils/constants';

describe('gestures', () => {
  describe('detectGesture', () => {
    it('should detect tap gesture', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 102, y: 101 }, // Small movement
        timestamp: 1150, // 150ms (< TAP_MAX_DURATION)
      };
      expect(detectGesture(start, end)).toBe('tap');
    });

    it('should detect long press gesture', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 101, y: 101 }, // Minimal movement
        timestamp: 1600, // 600ms (>= LONG_PRESS_DURATION)
      };
      expect(detectGesture(start, end)).toBe('longPress');
    });

    it('should detect swipe gesture', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 200, y: 100 }, // Large horizontal movement
        timestamp: 1200, // 200ms (< SWIPE_MAX_DURATION)
      };
      expect(detectGesture(start, end)).toBe('swipe');
    });

    it('should return none for ambiguous gestures', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 105, y: 105 }, // Some movement
        timestamp: 1400, // 400ms (between tap and long press)
      };
      expect(detectGesture(start, end)).toBe('none');
    });
  });

  describe('getSwipeDirection', () => {
    it('should calculate right swipe direction', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 100 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBeCloseTo(1);
      expect(direction.y).toBeCloseTo(0);
    });

    it('should calculate left swipe direction', () => {
      const start = { x: 200, y: 100 };
      const end = { x: 100, y: 100 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBeCloseTo(-1);
      expect(direction.y).toBeCloseTo(0);
    });

    it('should calculate down swipe direction', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 100, y: 200 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBeCloseTo(0);
      expect(direction.y).toBeCloseTo(1);
    });

    it('should normalize diagonal swipe', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 200 };
      const direction = getSwipeDirection(start, end);
      const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
      expect(magnitude).toBeCloseTo(1); // Unit vector
    });

    it('should handle zero movement', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 100, y: 100 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });
  });

  describe('normalizeCoordinates', () => {
    it('should normalize coordinates to canvas space', () => {
      const screenPos = { x: 150, y: 125 };
      const canvasRect = new DOMRect(100, 100, 400, 300); // x, y, width, height
      const canvasSize = { width: 800, height: 600 };

      const normalized = normalizeCoordinates(screenPos, canvasRect, canvasSize);

      // Screen position 150 is 50px into the canvas (150-100)
      // Canvas is 400px wide but logically 800 wide, so scale 2x
      expect(normalized.x).toBeCloseTo(100); // 50 * 2
      expect(normalized.y).toBeCloseTo(50);  // 25 * 2
    });

    it('should handle top-left corner', () => {
      const screenPos = { x: 100, y: 100 };
      const canvasRect = new DOMRect(100, 100, 400, 300);
      const canvasSize = { width: 800, height: 600 };

      const normalized = normalizeCoordinates(screenPos, canvasRect, canvasSize);

      expect(normalized.x).toBeCloseTo(0);
      expect(normalized.y).toBeCloseTo(0);
    });

    it('should handle center point', () => {
      const screenPos = { x: 300, y: 250 }; // Center of canvas
      const canvasRect = new DOMRect(100, 100, 400, 300);
      const canvasSize = { width: 800, height: 600 };

      const normalized = normalizeCoordinates(screenPos, canvasRect, canvasSize);

      expect(normalized.x).toBeCloseTo(400); // Half of 800
      expect(normalized.y).toBeCloseTo(300); // Half of 600
    });
  });
});

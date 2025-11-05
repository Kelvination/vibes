import { Vector2D, GestureType } from '../types';
import { INPUT, distance } from './constants';

export interface TouchPoint {
  position: Vector2D;
  timestamp: number;
}

/**
 * Detect gesture type based on touch points
 */
export function detectGesture(
  startPoint: TouchPoint,
  endPoint: TouchPoint
): GestureType {
  const duration = endPoint.timestamp - startPoint.timestamp;
  const dist = distance(startPoint.position, endPoint.position);

  // Long press: held for >500ms, minimal movement
  if (duration >= INPUT.LONG_PRESS_DURATION && dist < INPUT.SWIPE_MIN_DISTANCE) {
    return 'longPress';
  }

  // Swipe: quick movement over distance threshold
  if (duration < INPUT.SWIPE_MAX_DURATION && dist >= INPUT.SWIPE_MIN_DISTANCE) {
    return 'swipe';
  }

  // Tap: quick touch with minimal movement
  if (duration < INPUT.TAP_MAX_DURATION && dist < INPUT.SWIPE_MIN_DISTANCE) {
    return 'tap';
  }

  return 'none';
}

/**
 * Calculate swipe direction vector
 */
export function getSwipeDirection(start: Vector2D, end: Vector2D): Vector2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  if (magnitude === 0) return { x: 0, y: 0 };

  return {
    x: dx / magnitude,
    y: dy / magnitude,
  };
}

/**
 * Normalize screen coordinates to canvas coordinates
 * @param screenPos Screen position (from touch/mouse event)
 * @param canvasRect Canvas bounding rectangle
 * @param canvasSize Logical canvas size
 */
export function normalizeCoordinates(
  screenPos: Vector2D,
  canvasRect: DOMRect,
  canvasSize: { width: number; height: number }
): Vector2D {
  // Convert screen position to canvas-relative position
  const relativeX = screenPos.x - canvasRect.left;
  const relativeY = screenPos.y - canvasRect.top;

  // Scale to logical canvas coordinates
  const scaleX = canvasSize.width / canvasRect.width;
  const scaleY = canvasSize.height / canvasRect.height;

  return {
    x: relativeX * scaleX,
    y: relativeY * scaleY,
  };
}

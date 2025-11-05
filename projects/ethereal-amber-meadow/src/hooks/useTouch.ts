import { useEffect, useRef, useCallback } from 'react';
import { Vector2D, GestureEvent } from '../types';
import { detectGesture, getSwipeDirection, normalizeCoordinates, TouchPoint } from '../utils/gestures';

export interface UseTouchOptions {
  onTap?: (position: Vector2D) => void;
  onLongPress?: (position: Vector2D) => void;
  onSwipe?: (position: Vector2D, direction: Vector2D) => void;
  onGesture?: (event: GestureEvent) => void;
  canvasSize?: { width: number; height: number };
  preventDefault?: boolean; // Prevent default touch behaviors
}

export interface UseTouchReturn {
  ref: React.RefObject<HTMLElement>;
}

export function useTouch(options: UseTouchOptions = {}): UseTouchReturn {
  const {
    onTap,
    onLongPress,
    onSwipe,
    onGesture,
    canvasSize = { width: 800, height: 600 },
    preventDefault = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const startPointRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Get position from touch or mouse event
  const getEventPosition = useCallback((
    event: TouchEvent | MouseEvent
  ): Vector2D => {
    const element = elementRef.current;
    if (!element) return { x: 0, y: 0 };

    const rect = element.getBoundingClientRect();
    let screenX: number;
    let screenY: number;

    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      screenX = event.touches[0]!.clientX;
      screenY = event.touches[0]!.clientY;
    } else if ('changedTouches' in event && event.changedTouches.length > 0) {
      // Touch end event
      screenX = event.changedTouches[0]!.clientX;
      screenY = event.changedTouches[0]!.clientY;
    } else if ('clientX' in event) {
      // Mouse event
      screenX = event.clientX;
      screenY = event.clientY;
    } else {
      return { x: 0, y: 0 };
    }

    return normalizeCoordinates(
      { x: screenX, y: screenY },
      rect,
      canvasSize
    );
  }, [canvasSize]);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle touch/mouse start
  const handleStart = useCallback((event: TouchEvent | MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const position = getEventPosition(event);
    startPointRef.current = {
      position,
      timestamp: Date.now(),
    };

    // Start long press timer
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      if (startPointRef.current) {
        // Long press detected
        if (onLongPress) {
          onLongPress(startPointRef.current.position);
        }
        if (onGesture) {
          onGesture({
            type: 'longPress',
            position: startPointRef.current.position,
            duration: Date.now() - startPointRef.current.timestamp,
          });
        }
      }
    }, 500); // INPUT.LONG_PRESS_DURATION
  }, [preventDefault, getEventPosition, clearLongPressTimer, onLongPress, onGesture]);

  // Handle touch/mouse move
  const handleMove = useCallback((event: TouchEvent | MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    // Cancel long press on movement
    clearLongPressTimer();
  }, [preventDefault, clearLongPressTimer]);

  // Handle touch/mouse end
  const handleEnd = useCallback((event: TouchEvent | MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    clearLongPressTimer();

    if (!startPointRef.current) return;

    const position = getEventPosition(event);
    const endPoint: TouchPoint = {
      position,
      timestamp: Date.now(),
    };

    const gestureType = detectGesture(startPointRef.current, endPoint);

    if (gestureType === 'tap' && onTap) {
      onTap(position);
    }

    if (gestureType === 'swipe' && onSwipe) {
      const direction = getSwipeDirection(
        startPointRef.current.position,
        endPoint.position
      );
      onSwipe(position, direction);
    }

    if (onGesture && gestureType !== 'none') {
      const gestureEvent: GestureEvent = {
        type: gestureType,
        position,
      };

      if (gestureType === 'swipe') {
        gestureEvent.delta = {
          x: endPoint.position.x - startPointRef.current.position.x,
          y: endPoint.position.y - startPointRef.current.position.y,
        };
      }

      onGesture(gestureEvent);
    }

    startPointRef.current = null;
  }, [
    preventDefault,
    clearLongPressTimer,
    getEventPosition,
    onTap,
    onSwipe,
    onGesture,
  ]);

  // Handle touch cancel
  const handleCancel = useCallback(() => {
    clearLongPressTimer();
    startPointRef.current = null;
  }, [clearLongPressTimer]);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart as EventListener, { passive: !preventDefault });
    element.addEventListener('touchmove', handleMove as EventListener, { passive: !preventDefault });
    element.addEventListener('touchend', handleEnd as EventListener, { passive: !preventDefault });
    element.addEventListener('touchcancel', handleCancel as EventListener);

    // Mouse events (for desktop testing)
    element.addEventListener('mousedown', handleStart as EventListener);
    element.addEventListener('mousemove', handleMove as EventListener);
    element.addEventListener('mouseup', handleEnd as EventListener);

    return () => {
      element.removeEventListener('touchstart', handleStart as EventListener);
      element.removeEventListener('touchmove', handleMove as EventListener);
      element.removeEventListener('touchend', handleEnd as EventListener);
      element.removeEventListener('touchcancel', handleCancel as EventListener);
      element.removeEventListener('mousedown', handleStart as EventListener);
      element.removeEventListener('mousemove', handleMove as EventListener);
      element.removeEventListener('mouseup', handleEnd as EventListener);
      clearLongPressTimer();
    };
  }, [handleStart, handleMove, handleEnd, handleCancel, clearLongPressTimer, preventDefault]);

  return { ref: elementRef };
}

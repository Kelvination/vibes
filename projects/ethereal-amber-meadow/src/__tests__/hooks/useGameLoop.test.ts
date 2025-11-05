import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameLoop } from '../../hooks/useGameLoop';

describe('useGameLoop', () => {
  let rafCallbacks: ((time: number) => void)[] = [];
  let rafId = 0;
  let currentTime = 0;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    currentTime = performance.now();

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });

    // Mock cancelAnimationFrame
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      // Simple implementation - just clear callbacks
      rafCallbacks = [];
    });

    // Mock performance.now
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Helper function to trigger RAF callbacks
  const triggerRAF = (deltaMs: number = 16) => {
    currentTime += deltaMs;
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => cb(currentTime));
  };

  it('should return game loop controls', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    expect(result.current.start).toBeDefined();
    expect(result.current.stop).toBeDefined();
    expect(result.current.pause).toBeDefined();
    expect(result.current.resume).toBeDefined();
    expect(typeof result.current.isRunning).toBe('boolean');
    expect(typeof result.current.isPaused).toBe('boolean');
    expect(typeof result.current.fps).toBe('number');
  });

  it('should call onUpdate when started', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    // Trigger RAF callback
    act(() => {
      triggerRAF(16); // ~60fps frame time
    });

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should provide delta time to onUpdate callback', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    act(() => {
      triggerRAF(16);
    });

    expect(onUpdate).toHaveBeenCalledWith(expect.any(Number));
    const deltaTime = onUpdate.mock.calls[0]?.[0] as number;
    expect(deltaTime).toBeGreaterThan(0);
    expect(deltaTime).toBeLessThan(1); // Less than 1 second
  });

  it('should not call onUpdate when paused', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    onUpdate.mockClear();

    act(() => {
      triggerRAF(100);
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should resume after pause', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    onUpdate.mockClear();

    act(() => {
      result.current.resume();
    });

    act(() => {
      triggerRAF(16);
    });

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should stop the loop', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);

    onUpdate.mockClear();

    act(() => {
      triggerRAF(100);
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should pause when document becomes hidden', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, pauseOnBlur: true }));

    act(() => {
      result.current.start();
    });

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPaused).toBe(true);
  });

  it('should resume when document becomes visible again', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, pauseOnBlur: true }));

    act(() => {
      result.current.start();
    });

    // Simulate tab becoming hidden
    let hiddenValue = true;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hiddenValue,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPaused).toBe(true);

    // Simulate tab becoming visible
    hiddenValue = false;

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPaused).toBe(false);
  });

  it('should respect external paused prop', () => {
    const onUpdate = vi.fn();
    const { result, rerender } = renderHook(
      ({ paused }) => useGameLoop({ onUpdate, paused }),
      { initialProps: { paused: false } }
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isPaused).toBe(false);

    // Update paused prop
    rerender({ paused: true });

    expect(result.current.isPaused).toBe(true);
  });

  it('should clean up on unmount', () => {
    const onUpdate = vi.fn();
    const { result, unmount } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    unmount();

    // onUpdate should not be called after unmount
    onUpdate.mockClear();

    act(() => {
      triggerRAF(100);
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should target specific FPS', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, targetFPS: 30 }));

    act(() => {
      result.current.start();
    });

    // Simulate multiple frames
    for (let i = 0; i < 10; i++) {
      act(() => {
        triggerRAF(33); // ~30fps frame time
      });
    }

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should clamp large delta times', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, targetFPS: 60 }));

    act(() => {
      result.current.start();
    });

    // Simulate a huge time jump (e.g., computer waking from sleep)
    act(() => {
      triggerRAF(5000); // 5 seconds
    });

    expect(onUpdate).toHaveBeenCalled();
    const deltaTime = onUpdate.mock.calls[0]?.[0] as number;
    // Delta should be clamped, not 5 seconds
    expect(deltaTime).toBeLessThan(1);
  });
});

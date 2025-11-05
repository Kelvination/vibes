import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTouch } from '../../hooks/useTouch';

describe('useTouch', () => {
  it('should return a ref object', () => {
    const { result } = renderHook(() => useTouch());

    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull(); // Initially null until attached
  });

  it('should accept callback functions in options', () => {
    const onTap = vi.fn();
    const onLongPress = vi.fn();
    const onSwipe = vi.fn();
    const onGesture = vi.fn();

    const { result } = renderHook(() =>
      useTouch({
        onTap,
        onLongPress,
        onSwipe,
        onGesture,
      })
    );

    expect(result.current.ref).toBeDefined();
  });

  it('should accept canvasSize configuration', () => {
    const { result } = renderHook(() =>
      useTouch({
        canvasSize: { width: 1600, height: 1200 },
      })
    );

    expect(result.current.ref).toBeDefined();
  });

  it('should accept preventDefault configuration', () => {
    const { result } = renderHook(() =>
      useTouch({
        preventDefault: false,
      })
    );

    expect(result.current.ref).toBeDefined();
  });

  it('should handle all gesture callback options', () => {
    const callbacks = {
      onTap: vi.fn(),
      onLongPress: vi.fn(),
      onSwipe: vi.fn(),
      onGesture: vi.fn(),
      canvasSize: { width: 800, height: 600 },
      preventDefault: true,
    };

    const { result } = renderHook(() => useTouch(callbacks));

    expect(result.current.ref).toBeDefined();
  });

  it('should not crash when no options are provided', () => {
    const { result } = renderHook(() => useTouch());

    expect(result.current.ref).toBeDefined();
  });

  it('should handle partial options', () => {
    const { result } = renderHook(() =>
      useTouch({
        onTap: vi.fn(),
      })
    );

    expect(result.current.ref).toBeDefined();
  });

  it('should clean up on unmount', () => {
    const { result, unmount } = renderHook(() => useTouch());

    expect(result.current.ref).toBeDefined();

    // Unmount should not throw
    expect(() => unmount()).not.toThrow();
  });

  it('should handle rerender with different options', () => {
    const onTap1 = vi.fn();
    const onTap2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ onTap }) => useTouch({ onTap }),
      { initialProps: { onTap: onTap1 } }
    );

    expect(result.current.ref).toBeDefined();

    // Rerender with different callback
    rerender({ onTap: onTap2 });

    expect(result.current.ref).toBeDefined();
  });

  it('should handle changes in canvasSize', () => {
    const { result, rerender } = renderHook(
      ({ canvasSize }) => useTouch({ canvasSize }),
      { initialProps: { canvasSize: { width: 800, height: 600 } } }
    );

    expect(result.current.ref).toBeDefined();

    // Rerender with different canvas size
    rerender({ canvasSize: { width: 1600, height: 1200 } });

    expect(result.current.ref).toBeDefined();
  });

  it('should handle preventDefault toggle', () => {
    const { result, rerender } = renderHook(
      ({ preventDefault }) => useTouch({ preventDefault }),
      { initialProps: { preventDefault: true } }
    );

    expect(result.current.ref).toBeDefined();

    // Rerender with different preventDefault value
    rerender({ preventDefault: false });

    expect(result.current.ref).toBeDefined();
  });
});

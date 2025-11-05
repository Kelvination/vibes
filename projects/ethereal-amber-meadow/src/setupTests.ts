import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  setTimeout(callback, 16);
  return 0;
});

global.cancelAnimationFrame = vi.fn();

// Mock performance.now() for Matter.js
// Use Date.now() to provide consistent timing
const startTime = Date.now();
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now() - startTime,
  };
} else if (!performance.now) {
  performance.now = () => Date.now() - startTime;
}

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement, contextId: string) {
  if (contextId === '2d') {
    return {
      // Canvas reference
      canvas: this,
      // Drawing styles
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      shadowBlur: 0,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      lineDashOffset: 0,
      // Rectangle methods
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      // Path methods
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      // Drawing methods
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      isPointInPath: vi.fn(() => false),
      isPointInStroke: vi.fn(() => false),
      // Transform methods
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      getTransform: vi.fn(),
      // Image methods
      drawImage: vi.fn(),
      createImageData: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      // Gradient and pattern methods
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createPattern: vi.fn(),
      // Text methods
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      // Line dash methods
      getLineDash: vi.fn(() => []),
      setLineDash: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as any;

// Extend expect matchers
expect.extend({});

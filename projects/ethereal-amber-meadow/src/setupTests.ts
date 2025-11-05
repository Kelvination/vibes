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

// Extend expect matchers
expect.extend({});

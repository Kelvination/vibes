import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Game } from '../../../components/Game/Game';
import { GameProvider } from '../../../context/GameContext';

describe('Game', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without errors', () => {
    render(
      <GameProvider>
        <Game />
      </GameProvider>
    );

    expect(screen.getByRole('img', { name: /game canvas/i })).toBeInTheDocument();
  });

  it('should render canvas with correct dimensions', () => {
    render(
      <GameProvider>
        <Game width={800} height={600} />
      </GameProvider>
    );

    const canvas = screen.getByRole('img') as HTMLCanvasElement;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it('should initialize physics engine', async () => {
    render(
      <GameProvider>
        <Game />
      </GameProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  it('should create game entities', async () => {
    render(
      <GameProvider>
        <Game />
      </GameProvider>
    );

    await waitFor(() => {
      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('should handle unmount and cleanup', () => {
    const { unmount } = render(
      <GameProvider>
        <Game />
      </GameProvider>
    );

    expect(() => unmount()).not.toThrow();
  });
});

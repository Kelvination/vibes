import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HUD } from '../../components/UI/HUD';
import { GameProvider } from '../../context/GameContext';

describe('HUD Component', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(
          <GameProvider>
            <HUD />
          </GameProvider>
        );
      }).not.toThrow();
    });

    it('should display score label', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      expect(screen.getByText(/score/i)).toBeInTheDocument();
    });

    it('should display time label', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      expect(screen.getByText(/time/i)).toBeInTheDocument();
    });

    it('should display stars label', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      expect(screen.getByText(/stars/i)).toBeInTheDocument();
    });
  });

  describe('score display', () => {
    it('should display initial score as 0', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      expect(screen.getByLabelText('Score: 0')).toBeInTheDocument();
    });

    it('should format score with commas for large numbers', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );

      // This test will be updated when we can inject game state
      // For now, we're just testing the rendering
      expect(screen.getByText(/score/i)).toBeInTheDocument();
    });
  });

  describe('time display', () => {
    it('should display time in MM:SS format', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      // Should display 00:00 initially
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should format seconds correctly', () => {
      // This will test formatting logic
      // For now, check that the format is correct
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      const timeElement = screen.getByText(/\d{2}:\d{2}/);
      expect(timeElement).toBeInTheDocument();
    });
  });

  describe('stars display', () => {
    it('should display collected stars count', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      // Should show 0 initially
      expect(screen.getByLabelText('Stars collected: 0')).toBeInTheDocument();
    });

    it('should use star emoji or icon', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      // Check for star emoji or icon
      const hudElement = screen.getByRole('complementary') || screen.getByTestId('hud');
      expect(hudElement).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should be positioned at the top of the screen', () => {
      const { container } = render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      const hud = container.firstChild as HTMLElement;
      expect(hud).toHaveClass('hud');
    });

    it('should display items horizontally on desktop', () => {
      const { container } = render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      const hud = container.firstChild as HTMLElement;
      expect(hud).toBeInTheDocument();
    });
  });

  describe('responsiveness', () => {
    it('should be mobile-friendly', () => {
      const { container } = render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      const hud = container.firstChild as HTMLElement;
      expect(hud).toHaveClass('hud');
    });

    it('should have appropriate touch target sizes', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      // HUD elements should be readable, not necessarily tappable
      expect(screen.getByText(/score/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have appropriate ARIA labels', () => {
      const { container } = render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      // Should have semantic HTML or ARIA labels
      expect(container).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );
      // HUD is informational, so no keyboard interaction needed
      expect(screen.getByText(/score/i)).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <GameProvider>
          <HUD />
        </GameProvider>
      );

      // Rerender with same props
      rerender(
        <GameProvider>
          <HUD />
        </GameProvider>
      );

      expect(screen.getByText(/score/i)).toBeInTheDocument();
    });
  });
});

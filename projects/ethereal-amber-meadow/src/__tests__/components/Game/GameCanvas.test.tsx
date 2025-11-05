import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameCanvas } from '../../../components/Game/GameCanvas';
import { Ball } from '../../../engine/entities/Ball';
import { Goal } from '../../../engine/entities/Goal';
import { Obstacle } from '../../../engine/entities/Obstacle';
import { Star } from '../../../engine/entities/Star';
import { PhysicsEngine } from '../../../engine/Physics';
import { CANVAS } from '../../../utils/constants';

describe('GameCanvas', () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    // Create physics engine
    physics = new PhysicsEngine();
    physics.init({
      gravity: { x: 0, y: 1 },
      timeScale: 1,
      enableSleeping: false,
      friction: 0.1,
      restitution: 0.8,
    });
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('rendering', () => {
    it('should render a canvas element', () => {
      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      render(<GameCanvas entities={entities} />);

      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should set canvas width and height', () => {
      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      render(<GameCanvas entities={entities} width={800} height={600} />);

      const canvas = screen.getByRole('img') as HTMLCanvasElement;
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });

    it('should use default dimensions if not provided', () => {
      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      render(<GameCanvas entities={entities} />);

      const canvas = screen.getByRole('img') as HTMLCanvasElement;
      expect(canvas.width).toBe(CANVAS.WIDTH);
      expect(canvas.height).toBe(CANVAS.HEIGHT);
    });

    it('should have proper styling for touch handling', () => {
      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      render(<GameCanvas entities={entities} />);

      const canvas = screen.getByRole('img') as HTMLCanvasElement;

      // Check that inline styles are set (jsdom doesn't fully support computed styles)
      expect(canvas.style.touchAction).toBe('none');
      expect(canvas.style.userSelect).toBe('none');
    });
  });

  describe('entity rendering', () => {
    it('should call render on the ball', () => {
      const ball = new Ball(physics, { position: { x: 100, y: 100 } });
      const entities = {
        ball,
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      const renderSpy = vi.spyOn(ball, 'render');

      render(<GameCanvas entities={entities} />);

      // useEffect should trigger render
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should call render on obstacles', () => {
      const obstacle1 = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 200, y: 200 },
        width: 100,
        height: 20,
      });
      const obstacle2 = new Obstacle(physics, {
        type: 'circle',
        position: { x: 300, y: 300 },
        radius: 25,
      });

      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [obstacle1, obstacle2],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      const spy1 = vi.spyOn(obstacle1, 'render');
      const spy2 = vi.spyOn(obstacle2, 'render');

      render(<GameCanvas entities={entities} />);

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should call render on stars', () => {
      const star1 = new Star(physics, { id: 'star-1', position: { x: 150, y: 150 }, radius: 15 });
      const star2 = new Star(physics, { id: 'star-2', position: { x: 250, y: 250 }, radius: 15 });

      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [star1, star2],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      const spy1 = vi.spyOn(star1, 'render');
      const spy2 = vi.spyOn(star2, 'render');

      render(<GameCanvas entities={entities} />);

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should call render on goal', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 });
      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [],
        goal,
      };

      const renderSpy = vi.spyOn(goal, 'render');

      render(<GameCanvas entities={entities} />);

      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('canvas accessibility', () => {
    it('should have proper aria-label', () => {
      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      render(<GameCanvas entities={entities} />);

      const canvas = screen.getByRole('img', { name: 'Game canvas' });
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('updates', () => {
    it('should re-render when entities prop changes', () => {
      const ball1 = new Ball(physics, { position: { x: 100, y: 100 } });
      const entities1 = {
        ball: ball1,
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      const { rerender } = render(<GameCanvas entities={entities1} />);

      const ball2 = new Ball(physics, { position: { x: 200, y: 200 } });
      const entities2 = {
        ball: ball2,
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      const ball2Spy = vi.spyOn(ball2, 'render');

      rerender(<GameCanvas entities={entities2} />);

      expect(ball2Spy).toHaveBeenCalled();
    });
  });

  describe('background color', () => {
    it('should accept custom background color', () => {
      const entities = {
        ball: new Ball(physics, { position: { x: 100, y: 100 } }),
        obstacles: [],
        stars: [],
        goal: new Goal(physics, { position: { x: 400, y: 300 }, width: 50, height: 50 }),
      };

      // Just test that it renders without error
      const { container } = render(
        <GameCanvas entities={entities} backgroundColor="#f0f0f0" />
      );

      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });
});

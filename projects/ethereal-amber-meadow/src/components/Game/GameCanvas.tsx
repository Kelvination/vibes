import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Ball } from '../../engine/entities/Ball';
import { Obstacle } from '../../engine/entities/Obstacle';
import { Star } from '../../engine/entities/Star';
import { Goal } from '../../engine/entities/Goal';
import { CANVAS } from '../../utils/constants';

export interface GameCanvasProps {
  entities: {
    ball: Ball;
    obstacles: Obstacle[];
    stars: Star[];
    goal: Goal;
  };
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface GameCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  render: () => void;
}

/**
 * GameCanvas Component
 *
 * Renders the game world using HTML5 Canvas.
 * Displays all game entities (ball, obstacles, stars, goal) on the canvas.
 *
 * @param entities - Game entities to render
 * @param width - Canvas width (default: CANVAS.WIDTH)
 * @param height - Canvas height (default: CANVAS.HEIGHT)
 * @param backgroundColor - Background color (default: CANVAS.BACKGROUND_COLOR)
 */
export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ entities, width = CANVAS.WIDTH, height = CANVAS.HEIGHT, backgroundColor = CANVAS.BACKGROUND_COLOR }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Expose canvas ref to parent
    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    /**
     * Render all entities to the canvas
     */
    const renderEntities = (): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Render entities in order (back to front):
      // 1. Obstacles (background)
      entities.obstacles.forEach(obstacle => {
        obstacle.render(ctx);
      });

      // 2. Stars (collectibles)
      entities.stars.forEach(star => {
        star.render(ctx);
      });

      // 3. Goal (target)
      entities.goal.render(ctx);

      // 4. Ball (player - always on top)
      entities.ball.render(ctx);
    };

    // Initial render and re-render when entities change
    useEffect(() => {
      renderEntities();
    }, [entities, width, height, backgroundColor]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label="Game canvas"
        style={{
          display: 'block',
          touchAction: 'none', // Prevent default touch behaviors
          userSelect: 'none', // Prevent text selection
        }}
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';

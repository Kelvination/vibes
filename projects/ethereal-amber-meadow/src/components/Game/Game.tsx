import React, { useRef, useEffect, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { PhysicsEngine } from '../../engine/Physics';
import { Ball } from '../../engine/entities/Ball';
import { Obstacle } from '../../engine/entities/Obstacle';
import { Star } from '../../engine/entities/Star';
import { Goal } from '../../engine/entities/Goal';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useTouch } from '../../hooks/useTouch';
import { useGameState, useGameActions } from '../../context/GameContext';
import { CANVAS, PHYSICS, BALL } from '../../utils/constants';

export interface GameProps {
  width?: number;
  height?: number;
}

/**
 * Game Component
 *
 * Main game component that integrates:
 * - Physics engine
 * - Game loop
 * - Touch input
 * - Entity rendering
 *
 * This component manages the game state and coordinates all game systems.
 */
export const Game: React.FC<GameProps> = ({
  width = CANVAS.WIDTH,
  height = CANVAS.HEIGHT,
}) => {
  const gameState = useGameState();
  const { updateTime } = useGameActions();

  // Physics engine
  const physicsRef = useRef<PhysicsEngine | null>(null);

  // Game entities
  const [entities, setEntities] = useState<{
    ball: Ball | null;
    obstacles: Obstacle[];
    stars: Star[];
    goal: Goal | null;
  }>({
    ball: null,
    obstacles: [],
    stars: [],
    goal: null,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Initialize physics engine and entities
   */
  useEffect(() => {
    // Create physics engine
    const physics = new PhysicsEngine();
    physics.init({
      gravity: PHYSICS.GRAVITY,
      timeScale: PHYSICS.TIME_SCALE,
      enableSleeping: PHYSICS.ENABLE_SLEEPING,
      friction: PHYSICS.DEFAULT_FRICTION,
      restitution: PHYSICS.DEFAULT_RESTITUTION,
    });

    physicsRef.current = physics;

    // Create boundaries (walls)
    const wallThickness = 20;

    // Floor
    physics.createRectangle(
      width / 2,
      height - wallThickness / 2,
      width,
      wallThickness,
      { isStatic: true, label: 'floor' }
    );

    // Ceiling
    physics.createRectangle(
      width / 2,
      wallThickness / 2,
      width,
      wallThickness,
      { isStatic: true, label: 'ceiling' }
    );

    // Left wall
    physics.createRectangle(
      wallThickness / 2,
      height / 2,
      wallThickness,
      height,
      { isStatic: true, label: 'left-wall' }
    );

    // Right wall
    physics.createRectangle(
      width - wallThickness / 2,
      height / 2,
      wallThickness,
      height,
      { isStatic: true, label: 'right-wall' }
    );

    // Create ball
    const ball = new Ball(physics, {
      position: { x: 100, y: 100 },
      radius: BALL.RADIUS,
    });

    // Create goal
    const goal = new Goal(physics, {
      position: { x: width - 100, y: height - 100 },
      width: 50,
      height: 50,
    });

    // Create sample obstacles
    const obstacles: Obstacle[] = [
      new Obstacle(physics, {
        type: 'rectangle',
        position: { x: width / 2, y: height / 2 },
        width: 200,
        height: 20,
      }),
    ];

    // Create sample stars
    const stars: Star[] = [
      new Star(physics, { id: 'star-1', position: { x: width / 3, y: height / 3 }, radius: 15 }),
      new Star(physics, { id: 'star-2', position: { x: (2 * width) / 3, y: height / 3 }, radius: 15 }),
    ];

    setEntities({
      ball,
      obstacles,
      stars,
      goal,
    });

    // Cleanup on unmount
    return () => {
      physics.destroy();
    };
  }, [width, height]);

  /**
   * Game loop update function
   */
  const handleUpdate = (deltaTime: number): void => {
    if (!physicsRef.current || gameState.status !== 'playing') return;

    // Update physics
    physicsRef.current.update(deltaTime * 1000); // Convert to ms

    // Update entities
    if (entities.ball) {
      entities.ball.update(deltaTime);
    }

    entities.stars.forEach(star => star.update(deltaTime));

    // Update game time
    updateTime(deltaTime);

    // Force re-render to update canvas
    setEntities(prev => ({ ...prev }));
  };

  // Game loop
  const gameLoop = useGameLoop({
    onUpdate: handleUpdate,
    paused: gameState.status !== 'playing',
    pauseOnBlur: true,
  });

  // Start game loop when game starts
  useEffect(() => {
    if (gameState.status === 'playing' && !gameLoop.isRunning) {
      gameLoop.start();
    } else if (gameState.status !== 'playing' && gameLoop.isRunning) {
      gameLoop.stop();
    }

    return () => {
      gameLoop.stop();
    };
  }, [gameState.status]);

  // Touch input (for future implementation)
  const touch = useTouch({
    onTap: (position) => {
      console.log('Tap at:', position);
      // TODO: Add obstacle placement
    },
    onLongPress: (position) => {
      console.log('Long press at:', position);
      // TODO: Remove obstacle
    },
    onSwipe: (position, direction) => {
      console.log('Swipe:', position, direction);
      // TODO: Change gravity
    },
    canvasSize: { width, height },
  });

  // Attach touch handlers to canvas
  useEffect(() => {
    if (canvasRef.current) {
      touch.ref.current = canvasRef.current;
    }
  }, [canvasRef.current]);

  // Don't render until entities are initialized
  if (!entities.ball || !entities.goal) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <GameCanvas
        ref={canvasRef}
        entities={{
          ball: entities.ball,
          obstacles: entities.obstacles,
          stars: entities.stars,
          goal: entities.goal,
        }}
        width={width}
        height={height}
      />
    </div>
  );
};

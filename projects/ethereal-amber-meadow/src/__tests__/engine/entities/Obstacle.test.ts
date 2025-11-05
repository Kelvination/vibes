import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Obstacle } from '../../../engine/entities/Obstacle';
import { PHYSICS, OBSTACLE } from '../../../utils/constants';

describe('Obstacle', () => {
  let physics: PhysicsEngine;
  let obstacle: Obstacle;

  beforeEach(() => {
    physics = new PhysicsEngine();
    physics.init({
      gravity: PHYSICS.GRAVITY,
      timeScale: PHYSICS.TIME_SCALE,
      enableSleeping: PHYSICS.ENABLE_SLEEPING,
      friction: PHYSICS.DEFAULT_FRICTION,
      restitution: PHYSICS.DEFAULT_RESTITUTION,
    });
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('creation - rectangles', () => {
    it('should create a rectangle obstacle at specified position', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 200 },
        width: 50,
        height: 30,
      });
      const pos = obstacle.getPosition();
      expect(pos.x).toBeCloseTo(100);
      expect(pos.y).toBeCloseTo(200);
    });

    it('should have obstacle entity type', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
      });
      expect(obstacle.type).toBe('obstacle');
    });

    it('should be static by default', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
      });
      expect(obstacle.isStatic()).toBe(true);
    });

    it('should store width and height', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
      });
      expect(obstacle.getWidth()).toBe(50);
      expect(obstacle.getHeight()).toBe(30);
    });

    it('should throw error if width or height missing', () => {
      expect(() => {
        new Obstacle(physics, {
          type: 'rectangle',
          position: { x: 100, y: 100 },
        } as any);
      }).toThrow('Width and height are required for rectangle obstacles');
    });

    it('should apply rotation angle', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
        angle: Math.PI / 4, // 45 degrees
      });
      const angle = obstacle.getAngle();
      expect(angle).toBeCloseTo(Math.PI / 4);
    });
  });

  describe('creation - circles', () => {
    it('should create a circle obstacle at specified position', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 150, y: 250 },
        radius: 40,
      });
      const pos = obstacle.getPosition();
      expect(pos.x).toBeCloseTo(150);
      expect(pos.y).toBeCloseTo(250);
    });

    it('should store radius', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 150, y: 250 },
        radius: 40,
      });
      expect(obstacle.getRadius()).toBe(40);
    });

    it('should throw error if radius missing', () => {
      expect(() => {
        new Obstacle(physics, {
          type: 'circle',
          position: { x: 100, y: 100 },
        } as any);
      }).toThrow('Radius is required for circle obstacles');
    });

    it('should be static by default', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 100, y: 100 },
        radius: 30,
      });
      expect(obstacle.isStatic()).toBe(true);
    });
  });

  describe('creation - triangles', () => {
    it('should create a triangle obstacle', () => {
      obstacle = new Obstacle(physics, {
        type: 'triangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 50,
      });
      expect(obstacle.getObstacleType()).toBe('triangle');
    });

    it('should throw error if width or height missing', () => {
      expect(() => {
        new Obstacle(physics, {
          type: 'triangle',
          position: { x: 100, y: 100 },
        } as any);
      }).toThrow('Width and height are required for triangle obstacles');
    });
  });

  describe('obstacle types', () => {
    it('should return correct obstacle type for rectangle', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
      });
      expect(obstacle.getObstacleType()).toBe('rectangle');
    });

    it('should return correct obstacle type for circle', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 100, y: 100 },
        radius: 30,
      });
      expect(obstacle.getObstacleType()).toBe('circle');
    });
  });

  describe('physics', () => {
    it('should not move when static (rectangle)', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
      });
      const initialPos = obstacle.getPosition();

      // Simulate several frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalPos = obstacle.getPosition();
      expect(finalPos.x).toBeCloseTo(initialPos.x);
      expect(finalPos.y).toBeCloseTo(initialPos.y);
    });

    it('should not move when static (circle)', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 100, y: 100 },
        radius: 30,
      });
      const initialPos = obstacle.getPosition();

      // Simulate several frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalPos = obstacle.getPosition();
      expect(finalPos.x).toBeCloseTo(initialPos.x);
      expect(finalPos.y).toBeCloseTo(initialPos.y);
    });

    it('should be able to create dynamic obstacles', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
        isStatic: false,
      });
      expect(obstacle.isStatic()).toBe(false);
    });
  });

  describe('rendering', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;

      // Mock canvas context for testing
      ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        set fillStyle(value: string) {},
        set strokeStyle(value: string) {},
        set lineWidth(value: number) {},
      } as any;
    });

    it('should render rectangle without errors', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 400, y: 300 },
        width: 50,
        height: 30,
      });
      expect(() => obstacle.render(ctx)).not.toThrow();
    });

    it('should render circle without errors', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 400, y: 300 },
        radius: 30,
      });
      expect(() => obstacle.render(ctx)).not.toThrow();
    });

    it('should render triangle without errors', () => {
      obstacle = new Obstacle(physics, {
        type: 'triangle',
        position: { x: 400, y: 300 },
        width: 50,
        height: 50,
      });
      expect(() => obstacle.render(ctx)).not.toThrow();
    });

    it('should save and restore canvas context (rectangle)', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 400, y: 300 },
        width: 50,
        height: 30,
      });
      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      obstacle.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should save and restore canvas context (circle)', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 400, y: 300 },
        radius: 30,
      });
      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      obstacle.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should draw a circle for circle obstacles', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 400, y: 300 },
        radius: 30,
      });
      const arcSpy = vi.spyOn(ctx, 'arc');
      const fillSpy = vi.spyOn(ctx, 'fill');

      obstacle.render(ctx);

      expect(arcSpy).toHaveBeenCalled();
      expect(fillSpy).toHaveBeenCalled();
    });

    it('should draw a rectangle for rectangle obstacles', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 400, y: 300 },
        width: 50,
        height: 30,
      });
      const rectSpy = vi.spyOn(ctx, 'rect');
      const fillSpy = vi.spyOn(ctx, 'fill');

      obstacle.render(ctx);

      expect(rectSpy).toHaveBeenCalled();
      expect(fillSpy).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should return position for rectangle', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 200 },
        width: 50,
        height: 30,
      });
      const pos = obstacle.getPosition();
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
    });

    it('should return position for circle', () => {
      obstacle = new Obstacle(physics, {
        type: 'circle',
        position: { x: 100, y: 200 },
        radius: 30,
      });
      const pos = obstacle.getPosition();
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
    });

    it('should return angle', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 200 },
        width: 50,
        height: 30,
      });
      const angle = obstacle.getAngle();
      expect(typeof angle).toBe('number');
    });

    it('should return Matter.js body', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 200 },
        width: 50,
        height: 30,
      });
      const body = obstacle.getBody();
      expect(body).toBeDefined();
      expect(body.position).toBeDefined();
    });
  });

  describe('custom properties', () => {
    it('should allow custom color', () => {
      obstacle = new Obstacle(physics, {
        type: 'rectangle',
        position: { x: 100, y: 100 },
        width: 50,
        height: 30,
        color: '#ff0000',
      });
      // Color is private, but we can test that creation works
      expect(obstacle).toBeDefined();
    });
  });
});

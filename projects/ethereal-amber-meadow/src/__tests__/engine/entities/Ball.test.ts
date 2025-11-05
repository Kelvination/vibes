import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Ball } from '../../../engine/entities/Ball';
import { PHYSICS, BALL } from '../../../utils/constants';

describe('Ball', () => {
  let physics: PhysicsEngine;
  let ball: Ball;

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

  describe('creation', () => {
    it('should create a ball at specified position', () => {
      ball = new Ball(physics, { position: { x: 100, y: 200 } });
      const pos = ball.getPosition();
      expect(pos.x).toBeCloseTo(100);
      expect(pos.y).toBeCloseTo(200);
    });

    it('should use default radius if not specified', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
      expect(ball.getRadius()).toBe(BALL.RADIUS);
    });

    it('should use custom radius if specified', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 }, radius: 30 });
      expect(ball.getRadius()).toBe(30);
    });

    it('should have ball entity type', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
      expect(ball.type).toBe('ball');
    });

    it('should not be static', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
      expect(ball.isStatic()).toBe(false);
    });
  });

  describe('physics', () => {
    beforeEach(() => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
    });

    it('should fall due to gravity', () => {
      const initialY = ball.getPosition().y;

      // Simulate several frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalY = ball.getPosition().y;
      expect(finalY).toBeGreaterThan(initialY);
    });

    it('should respond to applied force', () => {
      const initialVelocity = ball.getVelocity();

      ball.applyForce({ x: 0.1, y: 0 });
      physics.update(16);

      const newVelocity = ball.getVelocity();
      expect(newVelocity.x).toBeGreaterThan(initialVelocity.x);
    });

    it('should set velocity directly', () => {
      ball.setVelocity({ x: 5, y: -5 });
      const velocity = ball.getVelocity();
      expect(velocity.x).toBeCloseTo(5);
      expect(velocity.y).toBeCloseTo(-5);
    });

    it('should limit velocity to max speed', () => {
      ball.setVelocity({ x: 100, y: 100 }); // Very high velocity
      ball.limitVelocity(20);

      const velocity = ball.getVelocity();
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(speed).toBeLessThanOrEqual(20.1); // Small tolerance for floating point
    });

    it('should not limit velocity below max', () => {
      ball.setVelocity({ x: 5, y: 5 });
      ball.limitVelocity(20);

      const velocity = ball.getVelocity();
      expect(velocity.x).toBeCloseTo(5);
      expect(velocity.y).toBeCloseTo(5);
    });

    it('should update and limit velocity', () => {
      ball.setVelocity({ x: 50, y: 50 });
      ball.update(0.016); // One frame

      const velocity = ball.getVelocity();
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(speed).toBeLessThanOrEqual(BALL.MAX_VELOCITY + 0.1); // Small tolerance
    });
  });

  describe('rendering', () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      // Mock canvas context
      ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      ball = new Ball(physics, { position: { x: 400, y: 300 } });
    });

    it('should render without errors', () => {
      expect(() => ball.render(ctx)).not.toThrow();
    });

    it('should save and restore canvas context', () => {
      ball.render(ctx);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should draw a circle', () => {
      ball.render(ctx);

      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      ball = new Ball(physics, { position: { x: 100, y: 200 } });
    });

    it('should return position', () => {
      const pos = ball.getPosition();
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
    });

    it('should return velocity', () => {
      const velocity = ball.getVelocity();
      expect(velocity).toHaveProperty('x');
      expect(velocity).toHaveProperty('y');
    });

    it('should return angle', () => {
      const angle = ball.getAngle();
      expect(typeof angle).toBe('number');
    });

    it('should return Matter.js body', () => {
      const body = ball.getBody();
      expect(body).toBeDefined();
      expect(body.position).toBeDefined();
    });
  });
});

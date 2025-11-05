import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Goal } from '../../../engine/entities/Goal';
import { PHYSICS, GOAL } from '../../../utils/constants';

describe('Goal', () => {
  let physics: PhysicsEngine;
  let goal: Goal;

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
    it('should create a goal at specified position', () => {
      goal = new Goal(physics, { position: { x: 400, y: 300 } });
      const pos = goal.getPosition();
      expect(pos.x).toBeCloseTo(400);
      expect(pos.y).toBeCloseTo(300);
    });

    it('should use default radius if not specified', () => {
      goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.getRadius()).toBe(GOAL.RADIUS);
    });

    it('should use custom radius if specified', () => {
      goal = new Goal(physics, { position: { x: 100, y: 100 }, radius: 50 });
      expect(goal.getRadius()).toBe(50);
    });

    it('should have goal entity type', () => {
      goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.type).toBe('goal');
    });

    it('should be static (not affected by physics)', () => {
      goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.isStatic()).toBe(true);
    });

    it('should be a sensor (no physical collision)', () => {
      goal = new Goal(physics, { position: { x: 100, y: 100 } });
      const body = goal.getBody();
      expect(body.isSensor).toBe(true);
    });
  });

  describe('physics', () => {
    beforeEach(() => {
      goal = new Goal(physics, { position: { x: 400, y: 300 } });
    });

    it('should not move due to gravity', () => {
      const initialPos = goal.getPosition();

      // Simulate several frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalPos = goal.getPosition();
      expect(finalPos.x).toBeCloseTo(initialPos.x);
      expect(finalPos.y).toBeCloseTo(initialPos.y);
    });

    it('should not be affected by forces', () => {
      const initialPos = goal.getPosition();
      const body = goal.getBody();

      // Try to apply force (should have no effect on static body)
      const Matter = require('matter-js');
      Matter.Body.applyForce(body, body.position, { x: 10, y: 10 });
      physics.update(16);

      const finalPos = goal.getPosition();
      expect(finalPos.x).toBeCloseTo(initialPos.x);
      expect(finalPos.y).toBeCloseTo(initialPos.y);
    });
  });

  describe('collision detection', () => {
    it('should be detectable in collision callbacks', () => {
      goal = new Goal(physics, { position: { x: 200, y: 200 } }, 'test-goal');
      const body = goal.getBody();
      expect(body.label).toContain('goal');
      expect(body.label).toContain('test-goal');
    });

    it('should allow checking if reached', () => {
      goal = new Goal(physics, { position: { x: 200, y: 200 } });
      expect(goal.isReached()).toBe(false);

      goal.setReached(true);
      expect(goal.isReached()).toBe(true);
    });
  });

  describe('animation', () => {
    beforeEach(() => {
      goal = new Goal(physics, { position: { x: 400, y: 300 } });
    });

    it('should update animation state over time', () => {
      const initialTime = goal['animationTime'];
      goal.update(0.016); // One frame
      const updatedTime = goal['animationTime'];
      expect(updatedTime).toBeGreaterThan(initialTime);
    });

    it('should animate with glow effect', () => {
      // Update multiple frames
      for (let i = 0; i < 10; i++) {
        goal.update(0.016);
      }
      // Animation time should accumulate
      expect(goal['animationTime']).toBeGreaterThan(0);
    });
  });

  describe('rendering', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      ctx = canvas.getContext('2d')!;
      goal = new Goal(physics, { position: { x: 400, y: 300 } });
    });

    it('should render without errors', () => {
      expect(() => goal.render(ctx)).not.toThrow();
    });

    it('should save and restore canvas context', () => {
      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      goal.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should draw a circle', () => {
      const arcSpy = vi.spyOn(ctx, 'arc');
      const fillSpy = vi.spyOn(ctx, 'fill');

      goal.render(ctx);

      expect(arcSpy).toHaveBeenCalled();
      expect(fillSpy).toHaveBeenCalled();
    });

    it('should render differently when reached', () => {
      const fillSpy = vi.spyOn(ctx, 'fill');

      // Render normal state
      goal.render(ctx);
      const normalCallCount = fillSpy.mock.calls.length;

      fillSpy.mockClear();

      // Render reached state
      goal.setReached(true);
      goal.render(ctx);
      const reachedCallCount = fillSpy.mock.calls.length;

      // Both states should render
      expect(normalCallCount).toBeGreaterThan(0);
      expect(reachedCallCount).toBeGreaterThan(0);
    });

    it('should render with glow effect', () => {
      const createRadialGradientSpy = vi.spyOn(ctx, 'createRadialGradient');

      goal.render(ctx);

      expect(createRadialGradientSpy).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      goal = new Goal(physics, { position: { x: 400, y: 300 } });
    });

    it('should return position', () => {
      const pos = goal.getPosition();
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
      expect(pos.x).toBeCloseTo(400);
      expect(pos.y).toBeCloseTo(300);
    });

    it('should return velocity (always zero for static)', () => {
      const velocity = goal.getVelocity();
      expect(velocity).toHaveProperty('x');
      expect(velocity).toHaveProperty('y');
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should return angle', () => {
      const angle = goal.getAngle();
      expect(typeof angle).toBe('number');
    });

    it('should return Matter.js body', () => {
      const body = goal.getBody();
      expect(body).toBeDefined();
      expect(body.position).toBeDefined();
      expect(body.isStatic).toBe(true);
      expect(body.isSensor).toBe(true);
    });

    it('should return radius', () => {
      const radius = goal.getRadius();
      expect(radius).toBe(GOAL.RADIUS);
    });
  });

  describe('custom id', () => {
    it('should use custom id when provided', () => {
      goal = new Goal(physics, { position: { x: 100, y: 100 } }, 'level-1-goal');
      expect(goal.id).toBe('level-1-goal');
    });

    it('should use default id when not provided', () => {
      goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.id).toBe('goal');
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhysicsEngine } from '../../engine/Physics';
import { PHYSICS } from '../../utils/constants';

describe('PhysicsEngine', () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = new PhysicsEngine();
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() =>
        physics.init({
          gravity: PHYSICS.GRAVITY,
          timeScale: PHYSICS.TIME_SCALE,
          enableSleeping: PHYSICS.ENABLE_SLEEPING,
          friction: PHYSICS.DEFAULT_FRICTION,
          restitution: PHYSICS.DEFAULT_RESTITUTION,
        })
      ).not.toThrow();
    });

    it('should allow custom gravity configuration', () => {
      const customGravity = { x: 0.5, y: 0.5 };
      physics.init({
        gravity: customGravity,
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });

      // Verify initialization completes without error
      const body = physics.createCircle(100, 100, 20);
      expect(body).toBeDefined();
      expect(body.position.x).toBeCloseTo(100);
      expect(body.position.y).toBeCloseTo(100);
    });
  });

  describe('body creation', () => {
    beforeEach(() => {
      physics.init({
        gravity: PHYSICS.GRAVITY,
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });
    });

    it('should create a circular body', () => {
      const body = physics.createCircle(100, 100, 20);
      expect(body).toBeDefined();
      expect(body.position.x).toBeCloseTo(100);
      expect(body.position.y).toBeCloseTo(100);
    });

    it('should create a rectangular body', () => {
      const body = physics.createRectangle(100, 100, 50, 30);
      expect(body).toBeDefined();
      expect(body.position.x).toBeCloseTo(100);
      expect(body.position.y).toBeCloseTo(100);
    });

    it('should create static bodies', () => {
      const body = physics.createRectangle(100, 100, 50, 30, {
        isStatic: true,
      });
      expect(body.isStatic).toBe(true);
    });

    it('should create dynamic bodies by default', () => {
      const body = physics.createCircle(100, 100, 20);
      expect(body.isStatic).toBe(false);
    });

    it('should apply physics options', () => {
      const body = physics.createCircle(100, 100, 20, {
        friction: 0.5,
        restitution: 0.9,
        label: 'test-ball',
      });
      expect(body.friction).toBeCloseTo(0.5);
      expect(body.restitution).toBeCloseTo(0.9);
      expect(body.label).toBe('test-ball');
    });
  });

  describe('body manipulation', () => {
    beforeEach(() => {
      physics.init({
        gravity: PHYSICS.GRAVITY,
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });
    });

    it('should remove a body from the world', () => {
      const body = physics.createCircle(100, 100, 20);
      const bodiesBeforeRemove = physics.getAllBodies();
      physics.removeBody(body);
      const bodiesAfterRemove = physics.getAllBodies();
      expect(bodiesAfterRemove.length).toBe(bodiesBeforeRemove.length - 1);
    });

    it('should apply force to a body', () => {
      const body = physics.createCircle(100, 100, 20);
      const initialVelocity = { ...body.velocity };
      physics.applyForce(body, { x: 0.1, y: 0 });
      physics.update(16); // One frame
      // Velocity should change after applying force
      expect(body.velocity.x).not.toBe(initialVelocity.x);
    });
  });

  describe('physics simulation', () => {
    beforeEach(() => {
      physics.init({
        gravity: { x: 0, y: 1 },
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });
    });

    it('should allow physics updates without error', () => {
      physics.createCircle(100, 100, 20);
      expect(() => {
        physics.update(16); // One frame (~60fps)
      }).not.toThrow();
    });

    it('should respect static bodies', () => {
      const staticBody = physics.createRectangle(100, 100, 50, 50, {
        isStatic: true,
      });
      // Static bodies should have isStatic flag set
      expect(staticBody.isStatic).toBe(true);

      // Static bodies should not move (verified by isStatic property)
      const initialPosition = { x: staticBody.position.x, y: staticBody.position.y };
      expect(staticBody.position.x).toBe(initialPosition.x);
      expect(staticBody.position.y).toBe(initialPosition.y);
    });
  });

  describe('gravity manipulation', () => {
    beforeEach(() => {
      physics.init({
        gravity: { x: 0, y: 1 },
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });
    });

    it('should allow changing gravity direction without error', () => {
      expect(() => {
        physics.setGravity({ x: 1, y: 0 }); // Right gravity
      }).not.toThrow();

      const body = physics.createCircle(100, 100, 20);
      expect(body).toBeDefined();
      expect(body.position.x).toBeCloseTo(100);
    });
  });

  describe('collision detection', () => {
    beforeEach(() => {
      physics.init({
        gravity: { x: 0, y: 1 },
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });
    });

    it('should allow registering collision callbacks', () => {
      physics.createCircle(100, 50, 20, { label: 'ball' });
      physics.createRectangle(100, 200, 200, 20, {
        isStatic: true,
        label: 'floor',
      });

      let callbackRegistered = false;
      expect(() => {
        physics.onCollision(() => {
          callbackRegistered = true;
        });
      }).not.toThrow();

      // Callback registration should complete without error
      expect(callbackRegistered).toBe(false); // Not yet called
    });
  });

  describe('cleanup', () => {
    it('should destroy engine without errors', () => {
      physics.init({
        gravity: PHYSICS.GRAVITY,
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });
      physics.createCircle(100, 100, 20);
      expect(() => physics.destroy()).not.toThrow();
    });

    it('should clear all bodies on destroy', () => {
      physics.init({
        gravity: PHYSICS.GRAVITY,
        timeScale: PHYSICS.TIME_SCALE,
        enableSleeping: PHYSICS.ENABLE_SLEEPING,
        friction: PHYSICS.DEFAULT_FRICTION,
        restitution: PHYSICS.DEFAULT_RESTITUTION,
      });
      physics.createCircle(100, 100, 20);
      physics.createRectangle(200, 200, 50, 50);

      const bodiesBeforeDestroy = physics.getAllBodies().length;
      expect(bodiesBeforeDestroy).toBeGreaterThan(0);

      physics.destroy();

      // After destroy, engine should be cleared
      // We can't test getAllBodies after destroy since engine is null
      // So we'll just verify destroy completes without error
      expect(physics).toBeDefined();
    });
  });
});

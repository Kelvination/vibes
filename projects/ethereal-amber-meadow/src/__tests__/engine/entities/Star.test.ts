import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Star } from '../../../engine/entities/Star';
import { PHYSICS } from '../../../utils/constants';

describe('Star', () => {
  let physics: PhysicsEngine;
  let star: Star;

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
    it('should create a star at specified position', () => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 200 }, radius: 15 });
      const pos = star.getPosition();
      expect(pos.x).toBeCloseTo(100);
      expect(pos.y).toBeCloseTo(200);
    });

    it('should use specified radius', () => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 20 });
      expect(star.getRadius()).toBe(20);
    });

    it('should have star entity type', () => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 15 });
      expect(star.type).toBe('star');
    });

    it('should be static by default', () => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 15 });
      expect(star.isStatic()).toBe(true);
    });

    it('should be a sensor (non-colliding)', () => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 15 });
      const body = star.getBody();
      expect(body.isSensor).toBe(true);
    });

    it('should start as not collected', () => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 15 });
      expect(star.isCollected()).toBe(false);
    });

    it('should use provided id', () => {
      star = new Star(physics, { id: 'star-42', position: { x: 100, y: 100 }, radius: 15 });
      expect(star.id).toBe('star-42');
    });
  });

  describe('collection', () => {
    beforeEach(() => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 15 });
    });

    it('should mark star as collected', () => {
      expect(star.isCollected()).toBe(false);
      star.collect();
      expect(star.isCollected()).toBe(true);
    });

    it('should not collect twice', () => {
      star.collect();
      expect(star.isCollected()).toBe(true);
      star.collect(); // Should not error
      expect(star.isCollected()).toBe(true);
    });

    it('should return collection timestamp', () => {
      const beforeCollect = Date.now();
      star.collect();
      const timestamp = star.getCollectionTimestamp();
      const afterCollect = Date.now();

      expect(timestamp).toBeGreaterThanOrEqual(beforeCollect);
      expect(timestamp).toBeLessThanOrEqual(afterCollect);
    });

    it('should return null timestamp if not collected', () => {
      expect(star.getCollectionTimestamp()).toBeNull();
    });
  });

  describe('physics', () => {
    beforeEach(() => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 15 });
    });

    it('should not move due to gravity (static)', () => {
      const initialY = star.getPosition().y;

      // Simulate several frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalY = star.getPosition().y;
      expect(finalY).toBeCloseTo(initialY);
    });

    it('should not have velocity', () => {
      const velocity = star.getVelocity();
      expect(velocity.x).toBeCloseTo(0);
      expect(velocity.y).toBeCloseTo(0);
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
      star = new Star(physics, { id: 'star-1', position: { x: 400, y: 300 }, radius: 15 });
    });

    it('should render without errors', () => {
      expect(() => star.render(ctx)).not.toThrow();
    });

    it('should save and restore canvas context', () => {
      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      star.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should not render when collected', () => {
      const fillSpy = vi.spyOn(ctx, 'fill');

      star.collect();
      star.render(ctx);

      // Should return early without drawing
      expect(fillSpy).not.toHaveBeenCalled();
    });

    it('should render when not collected', () => {
      const fillSpy = vi.spyOn(ctx, 'fill');

      star.render(ctx);

      expect(fillSpy).toHaveBeenCalled();
    });
  });

  describe('animation', () => {
    beforeEach(() => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 100 }, radius: 15 });
    });

    it('should update rotation angle over time', () => {
      const initialAngle = star.getRotationAngle();

      star.update(0.016); // One frame at 60fps
      const afterOneFrame = star.getRotationAngle();

      star.update(0.016); // Another frame
      const afterTwoFrames = star.getRotationAngle();

      // Rotation angle should increase over time
      expect(afterOneFrame).toBeGreaterThan(initialAngle);
      expect(afterTwoFrames).toBeGreaterThan(afterOneFrame);
    });

    it('should update pulse animation over time', () => {
      const initialScale = star.getPulseScale();

      star.update(0.5); // Half a second
      const afterUpdate = star.getPulseScale();

      // Scale should change (might be larger or smaller depending on phase)
      expect(afterUpdate).toBeGreaterThan(0);
      expect(afterUpdate).toBeLessThanOrEqual(1.2); // Within reasonable bounds
    });

    it('should not animate when collected', () => {
      star.collect();
      const initialAngle = star.getRotationAngle();

      star.update(0.016);

      expect(star.getRotationAngle()).toBe(initialAngle);
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      star = new Star(physics, { id: 'star-1', position: { x: 100, y: 200 }, radius: 15 });
    });

    it('should return position', () => {
      const pos = star.getPosition();
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
    });

    it('should return velocity', () => {
      const velocity = star.getVelocity();
      expect(velocity).toHaveProperty('x');
      expect(velocity).toHaveProperty('y');
    });

    it('should return angle', () => {
      const angle = star.getAngle();
      expect(typeof angle).toBe('number');
    });

    it('should return Matter.js body', () => {
      const body = star.getBody();
      expect(body).toBeDefined();
      expect(body.position).toBeDefined();
    });

    it('should return radius', () => {
      expect(star.getRadius()).toBe(15);
    });

    it('should return rotation angle', () => {
      const angle = star.getRotationAngle();
      expect(typeof angle).toBe('number');
      expect(angle).toBeGreaterThanOrEqual(0);
    });

    it('should return pulse scale', () => {
      const scale = star.getPulseScale();
      expect(typeof scale).toBe('number');
      expect(scale).toBeGreaterThan(0);
    });
  });

  describe('star shape rendering', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      ctx = canvas.getContext('2d')!;
      star = new Star(physics, { id: 'star-1', position: { x: 400, y: 300 }, radius: 15 });
    });

    it('should draw a star shape (not just a circle)', () => {
      const beginPathSpy = vi.spyOn(ctx, 'beginPath');
      const lineToSpy = vi.spyOn(ctx, 'lineTo');

      star.render(ctx);

      expect(beginPathSpy).toHaveBeenCalled();
      // Star shape has multiple points
      expect(lineToSpy.mock.calls.length).toBeGreaterThan(5);
    });
  });
});

import Matter from 'matter-js';
import { Vector2D, PhysicsConfig } from '../types';
import { PhysicsBodyOptions } from './types';

export class PhysicsEngine {
  private engine: Matter.Engine | null = null;
  private world: Matter.World | null = null;
  private collisionCallbacks: Map<
    string,
    (event: Matter.IEventCollision<Matter.Engine>) => void
  > = new Map();

  /**
   * Initialize the physics engine
   * @param config Physics configuration (gravity, etc.)
   */
  public init(config: PhysicsConfig): void {
    // Create Matter.js engine
    this.engine = Matter.Engine.create();

    // Set gravity from config
    this.engine.world.gravity.x = config.gravity.x;
    this.engine.world.gravity.y = config.gravity.y;

    // Set time scale
    this.engine.timing.timeScale = config.timeScale;

    // Enable sleeping if configured
    this.engine.enableSleeping = config.enableSleeping;

    // Store world reference
    this.world = this.engine.world;
  }

  /**
   * Update physics simulation
   * @param delta Time elapsed since last update (ms)
   */
  public update(delta: number): void {
    if (!this.engine) {
      throw new Error('Physics engine not initialized. Call init() first.');
    }

    // Run Matter.Engine.update with delta
    Matter.Engine.update(this.engine, delta);
  }

  /**
   * Create a rectangular physics body
   * @param x Center X position
   * @param y Center Y position
   * @param width Rectangle width
   * @param height Rectangle height
   * @param options Physics properties
   * @returns Matter.Body
   */
  public createRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: PhysicsBodyOptions
  ): Matter.Body {
    if (!this.world) {
      throw new Error('Physics engine not initialized. Call init() first.');
    }

    // Use Matter.Bodies.rectangle
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: options?.isStatic ?? false,
      friction: options?.friction,
      restitution: options?.restitution,
      density: options?.density,
      label: options?.label ?? '',
    });

    // Add to world
    Matter.World.add(this.world, body);

    // Return body
    return body;
  }

  /**
   * Create a circular physics body
   * @param x Center X position
   * @param y Center Y position
   * @param radius Circle radius
   * @param options Physics properties
   * @returns Matter.Body
   */
  public createCircle(
    x: number,
    y: number,
    radius: number,
    options?: PhysicsBodyOptions
  ): Matter.Body {
    if (!this.world) {
      throw new Error('Physics engine not initialized. Call init() first.');
    }

    // Use Matter.Bodies.circle
    const body = Matter.Bodies.circle(x, y, radius, {
      isStatic: options?.isStatic ?? false,
      friction: options?.friction,
      restitution: options?.restitution,
      density: options?.density,
      label: options?.label ?? '',
    });

    // Add to world
    Matter.World.add(this.world, body);

    // Return body
    return body;
  }

  /**
   * Remove a body from the physics world
   * @param body Body to remove
   */
  public removeBody(body: Matter.Body): void {
    if (!this.world) {
      throw new Error('Physics engine not initialized. Call init() first.');
    }

    // Use Matter.World.remove
    Matter.World.remove(this.world, body);
  }

  /**
   * Apply a force to a body
   * @param body Body to apply force to
   * @param force Force vector
   */
  public applyForce(body: Matter.Body, force: Vector2D): void {
    // Use Matter.Body.applyForce
    // applyForce takes position (point of application) and force vector
    Matter.Body.applyForce(body, body.position, force);
  }

  /**
   * Set gravity direction
   * @param gravity New gravity vector
   */
  public setGravity(gravity: Vector2D): void {
    if (!this.engine) {
      throw new Error('Physics engine not initialized. Call init() first.');
    }

    // Update engine.world.gravity
    this.engine.world.gravity.x = gravity.x;
    this.engine.world.gravity.y = gravity.y;
  }

  /**
   * Register collision callback
   * @param callback Function to call on collision
   */
  public onCollision(
    callback: (event: Matter.IEventCollision<Matter.Engine>) => void
  ): void {
    if (!this.engine) {
      throw new Error('Physics engine not initialized. Call init() first.');
    }

    // Use Matter.Events.on(engine, 'collisionStart', callback)
    const callbackId = `collision-${Date.now()}-${Math.random()}`;
    this.collisionCallbacks.set(callbackId, callback);
    Matter.Events.on(this.engine, 'collisionStart', callback);
  }

  /**
   * Get all bodies in the world
   */
  public getAllBodies(): Matter.Body[] {
    if (!this.world) {
      throw new Error('Physics engine not initialized. Call init() first.');
    }

    // Return Matter.Composite.allBodies(world)
    return Matter.Composite.allBodies(this.world);
  }

  /**
   * Clean up physics engine
   */
  public destroy(): void {
    // Clear all collision callbacks
    if (this.engine) {
      this.collisionCallbacks.forEach((callback) => {
        Matter.Events.off(this.engine!, 'collisionStart', callback);
      });
      this.collisionCallbacks.clear();
    }

    // Clear world
    if (this.world) {
      Matter.World.clear(this.world, false);
      this.world = null;
    }

    // Clear engine
    if (this.engine) {
      Matter.Engine.clear(this.engine);
      this.engine = null;
    }
  }
}

export default PhysicsEngine;

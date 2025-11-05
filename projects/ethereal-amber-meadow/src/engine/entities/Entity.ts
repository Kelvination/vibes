import Matter from 'matter-js';
import { Vector2D, EntityType } from '../../types';

/**
 * Base class for all game entities (Ball, Obstacle, Star, Goal, etc.)
 * Provides common functionality for physics bodies and rendering
 */
export abstract class Entity {
  protected body: Matter.Body;
  public readonly id: string;
  public readonly type: EntityType;

  constructor(body: Matter.Body, id: string, type: EntityType) {
    this.body = body;
    this.id = id;
    this.type = type;
    this.body.label = `${type}-${id}`;
  }

  /**
   * Get entity position
   */
  public getPosition(): Vector2D {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
    };
  }

  /**
   * Get entity velocity
   */
  public getVelocity(): Vector2D {
    return {
      x: this.body.velocity.x,
      y: this.body.velocity.y,
    };
  }

  /**
   * Get entity angle (radians)
   */
  public getAngle(): number {
    return this.body.angle;
  }

  /**
   * Get Matter.js body
   */
  public getBody(): Matter.Body {
    return this.body;
  }

  /**
   * Check if entity is static
   */
  public isStatic(): boolean {
    return this.body.isStatic;
  }

  /**
   * Render entity to canvas (to be implemented by subclasses)
   */
  public abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Update entity (optional, for animation or logic)
   */
  public update(deltaTime: number): void {
    // Override in subclasses if needed
  }
}

import Matter from 'matter-js';
import { Entity } from './Entity';
import { Vector2D, ObstacleType } from '../../types';
import { OBSTACLE, PHYSICS } from '../../utils/constants';
import type { PhysicsEngine } from '../Physics';

export interface ObstacleOptions {
  type: ObstacleType;
  position: Vector2D;
  width?: number; // For rectangles
  height?: number; // For rectangles
  radius?: number; // For circles
  angle?: number; // Rotation in radians
  color?: string;
  isStatic?: boolean;
}

export class Obstacle extends Entity {
  private readonly obstacleType: ObstacleType;
  private readonly color: string;
  private readonly outlineColor: string;
  private readonly width?: number;
  private readonly height?: number;
  private readonly radius?: number;

  constructor(physicsEngine: PhysicsEngine, options: ObstacleOptions, id: string = `obstacle-${Date.now()}`) {
    let body: Matter.Body;

    // Create physics body based on obstacle type
    switch (options.type) {
      case 'circle':
        if (!options.radius) {
          throw new Error('Radius is required for circle obstacles');
        }
        body = physicsEngine.createCircle(
          options.position.x,
          options.position.y,
          options.radius,
          {
            isStatic: options.isStatic ?? true,
            friction: PHYSICS.DEFAULT_FRICTION,
            restitution: PHYSICS.DEFAULT_RESTITUTION,
            label: `obstacle-circle-${id}`,
          }
        );
        break;

      case 'rectangle':
        if (!options.width || !options.height) {
          throw new Error('Width and height are required for rectangle obstacles');
        }
        body = physicsEngine.createRectangle(
          options.position.x,
          options.position.y,
          options.width,
          options.height,
          {
            isStatic: options.isStatic ?? true,
            friction: PHYSICS.DEFAULT_FRICTION,
            restitution: PHYSICS.DEFAULT_RESTITUTION,
            label: `obstacle-rectangle-${id}`,
          }
        );
        break;

      case 'triangle':
        // For now, we'll use a rectangle rotated 45 degrees as a placeholder
        // In a full implementation, you'd use Matter.Bodies.polygon
        if (!options.width || !options.height) {
          throw new Error('Width and height are required for triangle obstacles');
        }
        body = physicsEngine.createRectangle(
          options.position.x,
          options.position.y,
          options.width,
          options.height,
          {
            isStatic: options.isStatic ?? true,
            friction: PHYSICS.DEFAULT_FRICTION,
            restitution: PHYSICS.DEFAULT_RESTITUTION,
            label: `obstacle-triangle-${id}`,
          }
        );
        break;

      default:
        throw new Error(`Unknown obstacle type: ${options.type}`);
    }

    // Apply rotation if specified
    if (options.angle) {
      Matter.Body.setAngle(body, options.angle);
    }

    super(body, id, 'obstacle');

    this.obstacleType = options.type;
    this.color = options.color ?? OBSTACLE.COLOR;
    this.outlineColor = OBSTACLE.OUTLINE_COLOR;
    this.width = options.width;
    this.height = options.height;
    this.radius = options.radius;
  }

  /**
   * Get obstacle type
   */
  public getObstacleType(): ObstacleType {
    return this.obstacleType;
  }

  /**
   * Get width (for rectangles)
   */
  public getWidth(): number | undefined {
    return this.width;
  }

  /**
   * Get height (for rectangles)
   */
  public getHeight(): number | undefined {
    return this.height;
  }

  /**
   * Get radius (for circles)
   */
  public getRadius(): number | undefined {
    return this.radius;
  }

  /**
   * Render obstacle to canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const pos = this.getPosition();
    const angle = this.getAngle();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    switch (this.obstacleType) {
      case 'circle':
        if (this.radius) {
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.lineWidth = OBSTACLE.OUTLINE_WIDTH;
          ctx.strokeStyle = this.outlineColor;
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (this.width && this.height) {
          ctx.beginPath();
          ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.lineWidth = OBSTACLE.OUTLINE_WIDTH;
          ctx.strokeStyle = this.outlineColor;
          ctx.stroke();
        }
        break;

      case 'triangle':
        // Draw as a simple triangle for now
        if (this.width && this.height) {
          ctx.beginPath();
          ctx.moveTo(0, -this.height / 2);
          ctx.lineTo(this.width / 2, this.height / 2);
          ctx.lineTo(-this.width / 2, this.height / 2);
          ctx.closePath();
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.lineWidth = OBSTACLE.OUTLINE_WIDTH;
          ctx.strokeStyle = this.outlineColor;
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }

  /**
   * Update obstacle (currently no-op for static obstacles)
   */
  public update(deltaTime: number): void {
    // Static obstacles don't need updates
    // Override this if you want moving obstacles
  }
}

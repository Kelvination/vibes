import Matter from 'matter-js';
import { Entity } from './Entity';
import { Vector2D } from '../../types';
import { BALL, PHYSICS } from '../../utils/constants';
import { PhysicsEngine } from '../Physics';

export interface BallOptions {
  position: Vector2D;
  radius?: number;
  color?: string;
  mass?: number;
}

/**
 * Ball entity - the main player-controlled object in the game
 * Moves according to physics and can be manipulated by the player
 */
export class Ball extends Entity {
  private readonly radius: number;
  private readonly color: string;
  private readonly outlineColor: string;

  constructor(
    physicsEngine: PhysicsEngine,
    options: BallOptions,
    id: string = 'player-ball'
  ) {
    const radius = options.radius ?? BALL.RADIUS;
    const mass = options.mass ?? BALL.MASS;

    // Create physics body
    const body = physicsEngine.createCircle(options.position.x, options.position.y, radius, {
      friction: PHYSICS.DEFAULT_FRICTION,
      restitution: PHYSICS.DEFAULT_RESTITUTION,
      density: mass / (Math.PI * radius * radius),
      label: `ball-${id}`,
      isStatic: false,
    });

    super(body, id, 'ball');

    this.radius = radius;
    this.color = options.color ?? BALL.COLOR;
    this.outlineColor = BALL.OUTLINE_COLOR;
  }

  /**
   * Apply force to the ball
   */
  public applyForce(force: Vector2D): void {
    Matter.Body.applyForce(this.body, this.body.position, force);
  }

  /**
   * Set velocity directly
   */
  public setVelocity(velocity: Vector2D): void {
    Matter.Body.setVelocity(this.body, velocity);
  }

  /**
   * Get ball radius
   */
  public getRadius(): number {
    return this.radius;
  }

  /**
   * Limit velocity (prevent ball from going too fast)
   */
  public limitVelocity(maxVelocity: number): void {
    const velocity = this.getVelocity();
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

    if (speed > maxVelocity) {
      const scale = maxVelocity / speed;
      this.setVelocity({
        x: velocity.x * scale,
        y: velocity.y * scale,
      });
    }
  }

  /**
   * Render ball to canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const pos = this.getPosition();

    ctx.save();

    // Draw ball
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw outline
    ctx.lineWidth = BALL.OUTLINE_WIDTH;
    ctx.strokeStyle = this.outlineColor;
    ctx.stroke();

    // Draw rotation indicator (line from center to edge)
    const angle = this.getAngle();
    const lineEndX = pos.x + Math.cos(angle) * this.radius;
    const lineEndY = pos.y + Math.sin(angle) * this.radius;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Update ball (apply velocity limiting)
   */
  public update(deltaTime: number): void {
    this.limitVelocity(BALL.MAX_VELOCITY);
  }
}
